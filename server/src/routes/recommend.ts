import express from 'express';
import { inferenceManager } from '../utils/InferenceManager.js';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { importedData, excludeWatched, modelVersion } = req.body;

        if (!importedData) {
            return res.status(400).json({ error: 'Missing importedData' });
        }

        const entries: any[] = [];
        const lists = ['completed', 'current', 'dropped'];
        
        for (const listName of lists) {
            if (Array.isArray(importedData[listName])) {
                entries.push(...importedData[listName].map((entry: any) => ({
                    id: entry.id,
                    score: entry.score || 0,
                    status: listName
                })));
            }
        }

        // Get recommendations from Python ML model
        const recommendations = await inferenceManager.getRecommendations(entries, excludeWatched !== false, modelVersion || 'v2');
        
        if (!recommendations || recommendations.length === 0) {
            return res.json([]);
        }

        // We no longer fetch from AniList on the backend. 
        // We return the raw MAL IDs and scores to the frontend, 
        // and the frontend handles the batch GraphQL fetching.
        res.json(recommendations);
    } catch (err: any) {
        console.error('Error generating recommendations:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

export default router;
