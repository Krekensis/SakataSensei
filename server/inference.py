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
HIDDEN_DIM = 4096
BOTTLENECK_DIM = 1024

class Recommender(nn.Module):
    corpus_size: int
    hidden_dim: int = HIDDEN_DIM
    bottleneck_dim: int = BOTTLENECK_DIM

    @nn.compact
    def __call__(self, x, training: bool = False):
        h = nn.Dense(self.hidden_dim)(x)
        h = nn.swish(h)
        bottleneck = nn.Dense(self.bottleneck_dim, name="bottleneck")(h)
        z = bottleneck
        
        d1 = nn.Dense(self.hidden_dim // 2)(z)
        d1 = nn.swish(d1)
        d1 = nn.Dense(self.hidden_dim)(d1)
        d1 = nn.swish(d1)
        item_logits = nn.Dense(self.corpus_size, name="item_logits")(d1)
        
        d2 = nn.Dense(self.hidden_dim // 2)(z)
        d2 = nn.swish(d2)
        d2 = nn.Dense(self.hidden_dim)(d2)
        d2 = nn.swish(d2)
        rating_pred = nn.Dense(self.corpus_size, name="rating_pred")(d2)
        
        log_var_presence = self.param('log_var_presence', nn.initializers.zeros, (1,))
        log_var_rating = self.param('log_var_rating', nn.initializers.zeros, (1,))
        
        return item_logits, rating_pred, log_var_presence, log_var_rating

class HybridRecommender(nn.Module):
    corpus_size: int
    hidden_dim: int = HIDDEN_DIM
    bottleneck_dim: int = BOTTLENECK_DIM

    @nn.compact
    def __call__(self, x, item_features, training: bool = False):
        presence = x[:, :self.corpus_size]
        
        user_content = jnp.dot(presence, item_features)
        counts = jnp.maximum(jnp.sum(presence, axis=1, keepdims=True), 1.0)
        user_content = user_content / counts
        
        h_in = jnp.concatenate([x, user_content], axis=1)
        
        h = nn.Dense(self.hidden_dim)(h_in)
        h = nn.swish(h)
        bottleneck = nn.Dense(self.bottleneck_dim, name="bottleneck")(h)
        z = bottleneck
            
        d1 = nn.Dense(self.hidden_dim // 2)(z)
        d1 = nn.swish(d1)
        d1 = nn.Dense(self.hidden_dim)(d1)
        d1 = nn.swish(d1)
        item_logits = nn.Dense(self.corpus_size, name="item_logits")(d1)
        
        d2 = nn.Dense(self.hidden_dim // 2)(z)
        d2 = nn.swish(d2)
        d2 = nn.Dense(self.hidden_dim)(d2)
        d2 = nn.swish(d2)
        rating_pred = nn.Dense(self.corpus_size, name="rating_pred")(d2)
        
        log_var_presence = self.param('log_var_presence', nn.initializers.zeros, (1,))
        log_var_rating = self.param('log_var_rating', nn.initializers.zeros, (1,))
        
        return item_logits, rating_pred, log_var_presence, log_var_rating

class ContentAutoencoder(nn.Module):
    out_dim: int
    hidden_dim1: int = 1024
    hidden_dim2: int = 512
    bottleneck_dim: int = 256
    
    @nn.compact
    def __call__(self, x, training: bool = False):
        h = nn.Dense(self.hidden_dim1)(x)
        h = nn.swish(h)
        h = nn.Dense(self.hidden_dim2)(h)
        h = nn.swish(h)
        bottleneck = nn.Dense(self.bottleneck_dim, name="bottleneck")(h)
        
        h_dec = nn.Dense(self.hidden_dim2)(bottleneck)
        h_dec = nn.swish(h_dec)
        h_dec = nn.Dense(self.hidden_dim1)(h_dec)
        h_dec = nn.swish(h_dec)
        reconstruction = nn.Dense(self.out_dim)(h_dec)
        return reconstruction, bottleneck

def init_model_version(version, base_dir):
    model_path = os.path.join(base_dir, 'models', f'model_weights_{version}.msgpack')
    corpus_path = os.path.join(base_dir, 'models', f'corpus_mapping_{version}.json')
    
    if not os.path.exists(model_path) or not os.path.exists(corpus_path):
        print(f"Warning: Model files for {version} not found!")
        return None

    with open(corpus_path, 'r') as f:
        corpus_data = json.load(f)
    corpus_ids = corpus_data['corpus_ids']
    if isinstance(corpus_ids, list):
        corpus_ids = np.array(corpus_ids)
    
    local_corpus_size = len(corpus_ids)

    model = Recommender(corpus_size=local_corpus_size)
    rng = random.PRNGKey(0)
    dummy_input = jnp.ones((1, local_corpus_size * 2))
    variables = model.init({"params": rng, "noise": rng}, dummy_input)
    params = variables["params"]

    with open(model_path, 'rb') as f:
        params = serialization.from_bytes(params, f.read())

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

    # Warmup JIT to prevent timeout on first request
    try:
        predict(dummy_input)
        dummy_batch = jnp.zeros((500, local_corpus_size * 2))
        vmap_forward_fn(dummy_batch, 0.3)
    except Exception:
        pass

    return {
        'type': 'dae',
        'predict_fn': predict,
        'corpus_ids': corpus_ids,
        'vmap_forward_fn': vmap_forward_fn,
        'corpus_size': local_corpus_size
    }

def init_model_version_v4(base_dir):
    model_path = os.path.join(base_dir, 'models', 'model_weights_v4.msgpack')
    corpus_path = os.path.join(base_dir, 'models', 'corpus_mapping_v4.json')
    feats_path = os.path.join(base_dir, 'models', 'item_features_v4.npy')
    
    if not os.path.exists(model_path) or not os.path.exists(corpus_path) or not os.path.exists(feats_path):
        print("Warning: Model files for v4 not found!")
        return None

    with open(corpus_path, 'r') as f:
        corpus_data = json.load(f)
    corpus_ids = corpus_data['corpus_ids']
    if isinstance(corpus_ids, list):
        corpus_ids = np.array(corpus_ids)
    
    local_corpus_size = len(corpus_ids)
    item_features = np.load(feats_path)
    jnp_item_features = jnp.array(item_features)
    item_feat_dim = item_features.shape[1]

    model = HybridRecommender(corpus_size=local_corpus_size)
    rng = random.PRNGKey(0)
    dummy_input = jnp.ones((1, local_corpus_size * 2))
    dummy_feats = jnp.ones((local_corpus_size, item_feat_dim))
    variables = model.init({"params": rng, "noise": rng}, dummy_input, dummy_feats)
    params = variables["params"]

    with open(model_path, 'rb') as f:
        params = serialization.from_bytes(params, f.read())

    @jax.jit
    def predict(x):
        return model.apply({"params": params}, x, jnp_item_features, training=False)

    @jax.jit
    def get_all_scores(x, logit_weight=0.3):
        x_batched = jnp.expand_dims(x, 0)
        item_logits, rating_pred, _, _ = model.apply({"params": params}, x_batched, jnp_item_features, training=False)
        logits_1d = item_logits[0]
        preds_1d = rating_pred[0]
        
        norm_logits = (logits_1d - jnp.mean(logits_1d)) / (jnp.std(logits_1d) + 1e-6)
        norm_ratings = (preds_1d - jnp.mean(preds_1d)) / (jnp.std(preds_1d) + 1e-6)
        combined_score = (logit_weight * norm_logits) + ((1.0 - logit_weight) * norm_ratings)
        return combined_score

    vmap_forward_fn = jax.jit(jax.vmap(get_all_scores, in_axes=(0, None)))

    # Warmup JIT to prevent timeout on first request
    try:
        predict(dummy_input)
        dummy_batch = jnp.zeros((500, local_corpus_size * 2))
        vmap_forward_fn(dummy_batch, 0.3)
    except Exception:
        pass

    return {
        'type': 'dae',
        'predict_fn': predict,
        'corpus_ids': corpus_ids,
        'vmap_forward_fn': vmap_forward_fn,
        'corpus_size': local_corpus_size
    }

def init_model_content(base_dir):
    model_path = os.path.join(base_dir, 'models', 'content_ae_weights.msgpack')
    feats_path = os.path.join(base_dir, 'models', 'item_features_content.npy')
    meta_path = os.path.join(base_dir, 'models', 'content_metadata.json')
    
    if not os.path.exists(model_path) or not os.path.exists(feats_path) or not os.path.exists(meta_path):
        print("Warning: Model files for content not found!")
        return None
        
    item_features = np.load(feats_path)
    out_dim = item_features.shape[1]
    
    with open(meta_path, 'r') as f:
        meta = json.load(f)
    mal_ids = np.array(meta['mal_ids'])
    members = np.array(meta['members'])
    
    model = ContentAutoencoder(out_dim=out_dim)
    rng = random.PRNGKey(0)
    dummy_input = jnp.ones((1, out_dim))
    params = model.init({"params": rng}, dummy_input)["params"]
    
    with open(model_path, 'rb') as f:
        params = serialization.from_bytes(params, f.read())
        
    _, bottlenecks = model.apply({"params": params}, jnp.array(item_features), training=False)
    learned_embeddings = np.array(bottlenecks)
    
    norm_embeds = learned_embeddings / (np.linalg.norm(learned_embeddings, axis=1, keepdims=True) + 1e-8)
    
    return {
        'type': 'content',
        'corpus_ids': mal_ids,
        'members': members,
        'norm_embeds': norm_embeds,
        'corpus_size': len(mal_ids)
    }

def normalize_rating(score, user_mean, user_std):
    if score == 0:
        score = user_mean
    z_score = np.clip((score - user_mean) / user_std, -3.0, 3.0)
    abs_score = np.clip((score - 5.5) / 2.5, -2.5, 2.0)
    alpha = np.clip(user_std / 2.6, 0.3, 0.8)
    return np.clip(alpha * z_score + (1.0 - alpha) * abs_score, -2.5, 2.5)

def process_request(models, request_data):
    model_version = request_data.get('model_version', 'v2')
    if model_version not in models or models[model_version] is None:
        raise Exception(f"Model version {model_version} is not loaded.")
        
    model_info = models[model_version]
    entries = request_data.get('entries', [])
    exclude_watched = request_data.get('exclude_watched', True)
    top_k = request_data.get('top_k', 500)
    
    if model_info['type'] == 'content':
        corpus_ids = model_info['corpus_ids']
        members = model_info['members']
        norm_embeds = model_info['norm_embeds']
        popularity_weight = request_data.get('popularity_weight', 0.15)
        
        user_anime_list = [entry.get('id') for entry in entries if entry.get('score', 0) > 0 or entry.get('status') == 'completed']
        mal_id_to_idx = {aid: idx for idx, aid in enumerate(corpus_ids)}
        valid_indices = [mal_id_to_idx[aid] for aid in user_anime_list if aid in mal_id_to_idx]
        
        if not valid_indices:
            return {"recommendations": []}
            
        user_sims = np.dot(norm_embeds, norm_embeds[valid_indices].T)
        user_profile_sim = user_sims.mean(axis=1)
        log_members = np.log1p(members)
        max_log = log_members.max() if log_members.max() > 0 else 1.0
        popularity_scores = log_members / max_log
        
        combined_scores = (1.0 - popularity_weight) * user_profile_sim + popularity_weight * popularity_scores
        
        if exclude_watched:
            all_user_ids = [entry.get('id') for entry in entries]
            all_user_indices = [mal_id_to_idx[aid] for aid in all_user_ids if aid in mal_id_to_idx]
            combined_scores[all_user_indices] = -np.inf
            
        top_indices = np.argsort(combined_scores)[-top_k:][::-1]
        
        recs = []
        for idx in top_indices:
            if combined_scores[idx] == -np.inf:
                continue
                
            reasons = []
            sims_for_rec = user_sims[idx]
            sorted_args = np.argsort(sims_for_rec)[::-1]
            
            for arg_idx in sorted_args:
                if len(reasons) >= 3:
                    break
                # Only include if similarity contributed positively to the average
                if sims_for_rec[arg_idx] > 0.1:
                    reasons.append(int(corpus_ids[valid_indices[arg_idx]]))
                    
            recs.append({
                "id": int(corpus_ids[idx]),
                "score": float(combined_scores[idx]),
                "reasons": reasons
            })
            
        return {"recommendations": recs}
        
    else:
        predict_fn = model_info['predict_fn']
        corpus_ids = model_info['corpus_ids']
        vmap_forward_fn = model_info['vmap_forward_fn']
        local_corpus_size = model_info['corpus_size']
        logit_weight = request_data.get('logit_weight', 0.3)

        corpus_id_to_idx = {aid: idx for idx, aid in enumerate(corpus_ids)}

        mapped_entries = []
        rated_scores = []
        
        for entry in entries:
            mal_id = entry.get('id')
            score = entry.get('score', 0)
            status = entry.get('status', 'completed')
            if score > 10:
                score = score / 10.0
                
            if mal_id in corpus_id_to_idx:
                idx = corpus_id_to_idx[mal_id]
                mapped_entries.append({'idx': idx, 'score': score, 'status': status})
                if score > 0:
                    rated_scores.append(score)

        user_mean = float(np.mean(rated_scores)) if len(rated_scores) > 0 else 5.0
        user_std = float(np.std(rated_scores)) if len(rated_scores) > 1 else 2.0

        presence_vec = np.zeros(local_corpus_size, dtype=np.float32)
        rating_vec = np.zeros(local_corpus_size, dtype=np.float32)

        for me in mapped_entries:
            idx = me['idx']
            score = me['score']
            status = me['status']
            presence_vec[idx] = 1.0
            
            if status == 'dropped' and score == 0:
                rating_vec[idx] = normalize_rating(user_mean - 1.5 * user_std, user_mean, user_std)
            else:
                rating_vec[idx] = normalize_rating(score, user_mean, user_std)

        x_in = np.concatenate([presence_vec, rating_vec])
        x_in = jnp.expand_dims(jnp.array(x_in), 0)

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
        
        valid_reason_mask = np.array([
            (me['status'] not in ['dropped', 'planning', 'paused']) and (me['score'] >= user_mean or me['score'] == 0)
            for me in mapped_entries
        ])
        
        valid_indices = user_indices[valid_reason_mask]
        
        recs = []
        if len(valid_indices) > 0:
            MAX_HOLDOUTS = 500
            
            if len(valid_indices) > MAX_HOLDOUTS:
                valid_scores = np.array([me['score'] for me in mapped_entries])[valid_reason_mask]
                top_valid_args = np.argsort(valid_scores)[-MAX_HOLDOUTS:]
                valid_indices = valid_indices[top_valid_args]
                
            actual_holdout_count = len(valid_indices)
            
            if actual_holdout_count < MAX_HOLDOUTS:
                pad_count = MAX_HOLDOUTS - actual_holdout_count
                padded_indices = np.pad(valid_indices, (0, pad_count), mode='constant', constant_values=0)
            else:
                padded_indices = valid_indices
                
            x_batch = jnp.tile(x_in[0], (MAX_HOLDOUTS, 1))
            batch_indices = jnp.arange(MAX_HOLDOUTS)
            
            x_batch = x_batch.at[batch_indices, padded_indices].set(0.0)
            x_batch = x_batch.at[batch_indices, padded_indices + local_corpus_size].set(0.0)
            
            holdout_scores = vmap_forward_fn(x_batch, logit_weight)
            
            ho_scores_for_top_k = holdout_scores[:, top_indices]
            
            drops = top_scores[None, :] - ho_scores_for_top_k
            
            drops_t = drops.T
            
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
                    
                    if drops_for_rec[arg_idx] > 0:
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

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    models = {}
    try:
        models['v2'] = init_model_version('v2', base_dir)
        models['v3'] = init_model_version('v3', base_dir)
        models['v4'] = init_model_version_v4(base_dir)
        models['content'] = init_model_content(base_dir)
        
        if all(v is None for v in models.values()):
            raise Exception("No models found!")
            
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
            res = process_request(models, req)
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
