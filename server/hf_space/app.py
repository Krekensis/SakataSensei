import os
import json
import jax
import jax.numpy as jnp
from jax import random
import flax.linen as nn
from flax import serialization
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Suppress JAX warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import warnings
warnings.filterwarnings('ignore')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Global vars for fast inference
PREDICT_FN = None
CORPUS_IDS = None

def init_model():
    global PREDICT_FN, CORPUS_IDS, CORPUS_SIZE
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, 'model_weights_v2.msgpack')
    corpus_path = os.path.join(base_dir, 'corpus_mapping_v2.json')

    if not os.path.exists(model_path) or not os.path.exists(corpus_path):
        print("Warning: Model files not found! Ensure model_weights_v2.msgpack and corpus_mapping_v2.json are uploaded.")
        return

    # Load corpus mapping
    with open(corpus_path, 'r') as f:
        corpus_data = json.load(f)
    corpus_ids = corpus_data['corpus_ids']
    if isinstance(corpus_ids, list):
        corpus_ids = np.array(corpus_ids)
    
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

    PREDICT_FN = predict
    CORPUS_IDS = corpus_ids

def normalize_rating(score, user_mean, user_std):
    if score == 0:
        score = user_mean
    z_score = np.clip((score - user_mean) / user_std, -3.0, 3.0)
    abs_score = np.clip((score - 5.5) / 2.5, -2.5, 2.0)
    alpha = np.clip(user_std / 2.6, 0.3, 0.8)
    return np.clip(alpha * z_score + (1.0 - alpha) * abs_score, -2.5, 2.5)

# Initialize on startup
init_model()

class Entry(BaseModel):
    id: int
    score: Optional[float] = 0

class InferenceRequest(BaseModel):
    entries: List[Entry]
    exclude_watched: Optional[bool] = True
    top_k: Optional[int] = 500
    logit_weight: Optional[float] = 0.3

@app.get("/health")
def health_check():
    if PREDICT_FN is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy"}

@app.post("/predict")
def predict(request: InferenceRequest):
    if PREDICT_FN is None or CORPUS_IDS is None:
        raise HTTPException(status_code=503, detail="Model is not initialized. Check server logs.")

    entries = request.entries
    exclude_watched = request.exclude_watched
    top_k = request.top_k
    logit_weight = request.logit_weight

    corpus_id_to_idx = {aid: idx for idx, aid in enumerate(CORPUS_IDS)}

    # Filter to corpus and compute stats
    mapped_entries = []
    rated_scores = []
    
    for entry in entries:
        mal_id = entry.id
        score = entry.score or 0
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
    item_logits, rating_pred, _, _ = PREDICT_FN(x_in)
    
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
            "id": int(CORPUS_IDS[int(idx)]),
            "score": float(score)
        })

    return {"recommendations": recs}
