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

from huggingface_hub import hf_hub_download

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
PREDICT_FN_V2 = None
CORPUS_IDS_V2 = None
VMAP_FORWARD_FN_V2 = None

PREDICT_FN_V3 = None
CORPUS_IDS_V3 = None
VMAP_FORWARD_FN_V3 = None

def init_model_version(version: str):
    global CORPUS_SIZE
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, f'model_weights_{version}.msgpack')
    corpus_path = os.path.join(base_dir, f'corpus_mapping_{version}.json')

    # If running on HF Spaces and we have hf_hub_download available, try to fetch from Model Repo
    repo_id = os.environ.get("HF_MODEL_REPO")
    if repo_id:
        print(f"Downloading {version} from Hugging Face Model Repo: {repo_id}...")
        try:
            model_path = hf_hub_download(repo_id=repo_id, filename=f'model_weights_{version}.msgpack')
            corpus_path = hf_hub_download(repo_id=repo_id, filename=f'corpus_mapping_{version}.json')
        except Exception as e:
            print(f"Failed to download from Hub: {e}")

    if not os.path.exists(model_path) or not os.path.exists(corpus_path):
        print(f"Warning: Model files for {version} not found! Ensure model_weights_{version}.msgpack and corpus_mapping_{version}.json exist.")
        return None, None, None

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

    @jax.jit
    def get_all_scores(x, logit_weight=0.3):
        x_batched = jnp.expand_dims(x, 0)
        item_logits, rating_pred, _, _ = model.apply({"params": params}, x_batched, training=False)
        logits_1d = item_logits[0]
        preds_1d = rating_pred[0]
        
        norm_logits = (logits_1d - jnp.mean(logits_1d)) / (jnp.std(logits_1d) + 1e-6)
        norm_ratings = (preds_1d - jnp.mean(preds_1d)) / (jnp.std(preds_1d) + 1e-6)
        combined_score = (logit_weight * norm_logits) + ((1.0 - logit_weight) * norm_ratings)
        return combined_score

    vmap_forward_fn = jax.jit(jax.vmap(get_all_scores, in_axes=(0, None)))

    # Warmup JAX JIT compilation so it doesn't timeout on the first request
    try:
        predict(dummy_input)
        dummy_batch = jnp.zeros((500, CORPUS_SIZE * 2))
        vmap_forward_fn(dummy_batch, 0.3)
    except Exception as e:
        pass
        
    return predict, corpus_ids, vmap_forward_fn

def init_models():
    global PREDICT_FN_V2, CORPUS_IDS_V2, VMAP_FORWARD_FN_V2
    global PREDICT_FN_V3, CORPUS_IDS_V3, VMAP_FORWARD_FN_V3
    
    model_to_load = os.environ.get("MODEL_TO_LOAD")
    
    if model_to_load == "v2" or not model_to_load:
        print("Initializing V2 model...")
        PREDICT_FN_V2, CORPUS_IDS_V2, VMAP_FORWARD_FN_V2 = init_model_version('v2')
        
    if model_to_load == "v3" or not model_to_load:
        print("Initializing V3 model...")
        PREDICT_FN_V3, CORPUS_IDS_V3, VMAP_FORWARD_FN_V3 = init_model_version('v3')

def normalize_rating(score, user_mean, user_std):
    if score == 0:
        score = user_mean
    z_score = np.clip((score - user_mean) / user_std, -3.0, 3.0)
    abs_score = np.clip((score - 5.5) / 2.5, -2.5, 2.0)
    alpha = np.clip(user_std / 2.6, 0.3, 0.8)
    return np.clip(alpha * z_score + (1.0 - alpha) * abs_score, -2.5, 2.5)

# Initialize on startup
init_models()

class Entry(BaseModel):
    id: int
    score: Optional[float] = 0
    status: Optional[str] = 'completed'

class InferenceRequest(BaseModel):
    entries: List[Entry]
    exclude_watched: Optional[bool] = True
    top_k: Optional[int] = 500
    logit_weight: Optional[float] = 0.3
    model_version: Optional[str] = 'v2'

@app.get("/health")
def health_check():
    if PREDICT_FN_V2 is None and PREDICT_FN_V3 is None:
        raise HTTPException(status_code=503, detail="Models not loaded")
    return {"status": "healthy"}

@app.post("/predict")
def predict(request: InferenceRequest):
    if request.model_version == 'v3':
        predict_fn = PREDICT_FN_V3
        corpus_ids = CORPUS_IDS_V3
        vmap_fn = VMAP_FORWARD_FN_V3
    else:
        predict_fn = PREDICT_FN_V2
        corpus_ids = CORPUS_IDS_V2
        vmap_fn = VMAP_FORWARD_FN_V2

    if predict_fn is None or corpus_ids is None:
        raise HTTPException(status_code=503, detail=f"Model version {request.model_version} is not initialized. Check server logs.")

    entries = request.entries
    exclude_watched = request.exclude_watched
    top_k = request.top_k
    logit_weight = request.logit_weight

    corpus_id_to_idx = {aid: idx for idx, aid in enumerate(corpus_ids)}

    # Filter to corpus and compute stats
    mapped_entries = []
    rated_scores = []
    
    for entry in entries:
        mal_id = entry.id
        score = entry.score or 0
        status = entry.status or 'completed'
        if score > 10:
            score = score / 10.0
            
        if mal_id in corpus_id_to_idx:
            idx = corpus_id_to_idx[mal_id]
            mapped_entries.append({'idx': idx, 'score': score, 'status': status})
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
        status = me['status']
        presence_vec[idx] = 1.0
        
        if status == 'dropped' and score == 0:
            # Apply severe negative penalty for unrated dropped items
            rating_vec[idx] = normalize_rating(user_mean - 1.5 * user_std, user_mean, user_std)
        else:
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

    user_indices = np.array([me['idx'] for me in mapped_entries])
    
    # Determine which items are valid candidates for "Because you liked"
    valid_reason_mask = np.array([
        (me['status'] not in ['dropped', 'planning', 'paused']) and (me['score'] >= user_mean or me['score'] == 0)
        for me in mapped_entries
    ])
    
    valid_indices = user_indices[valid_reason_mask]
    
    recs = []
    if len(valid_indices) > 0:
        MAX_HOLDOUTS = 500
        
        # If user has more than 500 valid items, just take the top 500 rated ones
        if len(valid_indices) > MAX_HOLDOUTS:
            valid_scores = np.array([me['score'] for me in mapped_entries])[valid_reason_mask]
            top_valid_args = np.argsort(valid_scores)[-MAX_HOLDOUTS:]
            valid_indices = valid_indices[top_valid_args]
            
        actual_holdout_count = len(valid_indices)
        
        # Pad to exactly MAX_HOLDOUTS to prevent JAX recompilation
        if actual_holdout_count < MAX_HOLDOUTS:
            pad_count = MAX_HOLDOUTS - actual_holdout_count
            padded_indices = np.pad(valid_indices, (0, pad_count), mode='constant', constant_values=0)
        else:
            padded_indices = valid_indices
            
        # Create holdout batch of shape (MAX_HOLDOUTS, CORPUS_SIZE * 2)
        x_batch = jnp.tile(x_in[0], (MAX_HOLDOUTS, 1))
        batch_indices = jnp.arange(MAX_HOLDOUTS)
        
        # Zero out the presence and rating for the held-out items
        x_batch = x_batch.at[batch_indices, padded_indices].set(0.0)
        x_batch = x_batch.at[batch_indices, padded_indices + CORPUS_SIZE].set(0.0)
        
        # Run batched forward pass: shape (MAX_HOLDOUTS, CORPUS_SIZE)
        holdout_scores = vmap_fn(x_batch, logit_weight)
        
        # Get holdout scores for the top recommended items: shape (MAX_HOLDOUTS, top_k)
        ho_scores_for_top_k = holdout_scores[:, top_indices]
        
        # Calculate drops: baseline is (top_k,) -> broadcast to (MAX_HOLDOUTS, top_k)
        drops = top_scores[None, :] - ho_scores_for_top_k
        
        # Transpose drops to (top_k, MAX_HOLDOUTS)
        drops_t = drops.T
        
        # Nullify drops for the padded dummy rows so they are never selected
        if actual_holdout_count < MAX_HOLDOUTS:
            drops_t = drops_t.at[:, actual_holdout_count:].set(-jnp.inf)
        
        for i, (idx, score) in enumerate(zip(top_indices, top_scores)):
            if score == -jnp.inf:
                continue
            
            drops_for_rec = drops_t[i]
            sorted_args = jnp.argsort(drops_for_rec)[::-1]
            
            reasons = []
            for arg_idx in sorted_args:
                if len(reasons) >= 3:
                    break
                
                # Only include if holding out the item dropped the score
                if drops_for_rec[arg_idx] > 0:
                    # Map the padded index back to the corpus ID
                    reasons.append(int(corpus_ids[int(padded_indices[arg_idx])]))
            
            recs.append({
                "id": int(corpus_ids[int(idx)]),
                "score": float(score),
                "reasons": reasons
            })
    else:
        for idx, score in zip(top_indices, top_scores):
            if score == -jnp.inf:
                continue
            recs.append({
                "id": int(corpus_ids[int(idx)]),
                "score": float(score),
                "reasons": []
            })

    return {"recommendations": recs}
