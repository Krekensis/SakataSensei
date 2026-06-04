import sys
import json
import os
import jax
import jax.numpy as jnp
from jax import random
import flax.linen as nn
from flax import serialization
import numpy as np

# Suppress JAX warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import warnings
warnings.filterwarnings('ignore')

# Config matches training notebook
CORPUS_SIZE = 10000
HIDDEN_DIM = 4096
BOTTLENECK_DIM = 1024

class Recommender(nn.Module):
    hidden_dim: int = HIDDEN_DIM
    bottleneck_dim: int = BOTTLENECK_DIM
    corpus_size: int = CORPUS_SIZE

    @nn.compact
    def __call__(self, x, training: bool = False):
        # Encoder
        h = nn.Dense(self.hidden_dim)(x)
        h = nn.swish(h)
        bottleneck = nn.Dense(self.bottleneck_dim, name="bottleneck")(h)
        z = bottleneck
        
        # Decoder Head 1: Item Presence (Logits)
        d1 = nn.Dense(self.hidden_dim // 2)(z)
        d1 = nn.swish(d1)
        d1 = nn.Dense(self.hidden_dim)(d1)
        d1 = nn.swish(d1)
        item_logits = nn.Dense(self.corpus_size, name="item_logits")(d1)
        
        # Decoder Head 2: Rating Prediction
        d2 = nn.Dense(self.hidden_dim // 2)(z)
        d2 = nn.swish(d2)
        d2 = nn.Dense(self.hidden_dim)(d2)
        d2 = nn.swish(d2)
        rating_pred = nn.Dense(self.corpus_size, name="rating_pred")(d2)
        
        # Learnable uncertainty weights for multi-task loss (needed for loading weights)
        log_var_presence = self.param('log_var_presence', nn.initializers.zeros, (1,))
        log_var_rating = self.param('log_var_rating', nn.initializers.zeros, (1,))
        
        return item_logits, rating_pred, log_var_presence, log_var_rating

def init_model(model_path, corpus_path):
    # Load corpus mapping
    with open(corpus_path, 'r') as f:
        corpus_data = json.load(f)
    corpus_ids = corpus_data['corpus_ids']
    # If the corpus mapping is saved directly as an array of IDs, adapt structure
    if isinstance(corpus_ids, list):
        corpus_ids = np.array(corpus_ids)
    
    # Check length
    global CORPUS_SIZE
    CORPUS_SIZE = len(corpus_ids)

    # Initialize model
    model = Recommender(corpus_size=CORPUS_SIZE)
    rng = random.PRNGKey(0)
    dummy_input = jnp.ones((1, CORPUS_SIZE * 2))
    variables = model.init({"params": rng, "noise": rng}, dummy_input)
    params = variables["params"]

    # Load weights
    with open(model_path, 'rb') as f:
        params = serialization.from_bytes(params, f.read())

    # Create apply function bound to params for quick inference
    @jax.jit
    def predict(x):
        return model.apply({"params": params}, x, training=False)

    return predict, corpus_ids

def normalize_rating(score, user_mean, user_std):
    if score == 0:
        score = user_mean
    z_score = np.clip((score - user_mean) / user_std, -3.0, 3.0)
    abs_score = np.clip((score - 5.5) / 2.5, -2.5, 2.0)
    alpha = np.clip(user_std / 2.6, 0.3, 0.8)
    return np.clip(alpha * z_score + (1.0 - alpha) * abs_score, -2.5, 2.5)

def process_request(predict_fn, corpus_ids, request_data):
    entries = request_data.get('entries', [])
    exclude_watched = request_data.get('exclude_watched', True)
    top_k = request_data.get('top_k', 500)
    logit_weight = request_data.get('logit_weight', 0.3)

    corpus_id_to_idx = {aid: idx for idx, aid in enumerate(corpus_ids)}

    # Filter to corpus and compute stats
    mapped_entries = []
    rated_scores = []
    
    for entry in entries:
        mal_id = entry.get('id')
        score = entry.get('score', 0)
        # Handle 100-point scales from AniList just in case
        if score > 10:
            score = score / 10.0
            
        if mal_id in corpus_id_to_idx:
            idx = corpus_id_to_idx[mal_id]
            mapped_entries.append({'idx': idx, 'score': score})
            if score > 0:
                rated_scores.append(score)

    user_mean = float(np.mean(rated_scores)) if len(rated_scores) > 0 else 5.0
    user_std = float(np.std(rated_scores)) if len(rated_scores) > 1 else 2.0

    # Build input vector
    presence_vec = np.zeros(CORPUS_SIZE, dtype=np.float32)
    rating_vec = np.zeros(CORPUS_SIZE, dtype=np.float32)

    for me in mapped_entries:
        idx = me['idx']
        score = me['score']
        presence_vec[idx] = 1.0
        rating_vec[idx] = normalize_rating(score, user_mean, user_std)

    x_in = np.concatenate([presence_vec, rating_vec])
    x_in = jnp.expand_dims(jnp.array(x_in), 0)

    # Inference
    item_logits, rating_pred, _, _ = predict_fn(x_in)
    
    logits_1d = item_logits[0]
    preds_1d = rating_pred[0]
    presence_mask = presence_vec

    norm_logits = (logits_1d - jnp.mean(logits_1d)) / (jnp.std(logits_1d) + 1e-6)
    norm_ratings = (preds_1d - jnp.mean(preds_1d)) / (jnp.std(preds_1d) + 1e-6)
    
    combined_score = (logit_weight * norm_logits) + ((1.0 - logit_weight) * norm_ratings)
    
    if exclude_watched:
        combined_score = jnp.where(presence_mask > 0, -jnp.inf, combined_score)

    top_indices = jnp.argsort(combined_score)[-top_k:][::-1]
    top_scores = combined_score[top_indices]

    recs = []
    for idx, score in zip(top_indices, top_scores):
        if score == -jnp.inf:
            continue
        recs.append({
            "id": int(corpus_ids[int(idx)]),
            "score": float(score)
        })

    return {"recommendations": recs}

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, 'models', 'model_weights_v2.msgpack')
    corpus_path = os.path.join(base_dir, 'models', 'corpus_mapping_v2.json')

    try:
        predict_fn, corpus_ids = init_model(model_path, corpus_path)
        # Print ready signal to stdout so Node knows we're initialized
        print(json.dumps({"status": "ready"}), flush=True)
    except Exception as e:
        print(json.dumps({"error": f"Failed to initialize model: {str(e)}"}), flush=True)
        sys.exit(1)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            res = process_request(predict_fn, corpus_ids, req)
            # Add an id to the response if the request had one, to match them
            if 'req_id' in req:
                res['req_id'] = req['req_id']
            print(json.dumps(res), flush=True)
        except Exception as e:
            err = {"error": str(e)}
            if 'req_id' in req:
                err['req_id'] = req['req_id']
            print(json.dumps(err), flush=True)

if __name__ == "__main__":
    main()
