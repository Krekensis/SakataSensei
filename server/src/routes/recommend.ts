import express from 'express';
import { inferenceManager } from '../utils/InferenceManager.js';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { importedData, excludeWatched } = req.body;

        if (!importedData) {
            return res.status(400).json({ error: 'Missing importedData' });
        }

        const entries: any[] = [];
        const lists = ['completed', 'current', 'planning'];
        
        for (const listName of lists) {
            if (Array.isArray(importedData[listName])) {
                entries.push(...importedData[listName].map((entry: any) => ({
                    id: entry.id,
                    score: entry.score || 0
                })));
            }
        }

        // Get recommendations from Python ML model
        const recommendations = await inferenceManager.getRecommendations(entries, excludeWatched !== false);
        
        if (!recommendations || recommendations.length === 0) {
            return res.json([]);
        }

        const recommendedMalIds = recommendations.map(r => r.id);

        // Fetch anime details using AniList GraphQL API (much faster and no tight rate limit for 1 query compared to Jikan)
        const query = `
        query ($idMalIn: [Int]) {
            Page(page: 1, perPage: 50) {
                media(idMal_in: $idMalIn, type: ANIME) {
                    id
                    idMal
                    title {
                        romaji
                        english
                    }
                    coverImage {
                        extraLarge
                        color
                    }
                    status
                    format
                    startDate {
                        year
                    }
                    meanScore
                }
            }
        }`;

        const aniListRes = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { idMalIn: recommendedMalIds }
            })
        });

        if (!aniListRes.ok) {
            console.error('Failed to fetch from AniList', await aniListRes.text());
            return res.json(recommendations); // Return just IDs if AniList fails
        }

        const aniListData: any = await aniListRes.json();
        const mediaList = aniListData.data?.Page?.media || [];

        // Map the AniList metadata back to the recommendations array, keeping the ML model's order and score
        const metadataMap = new Map();
        for (const media of mediaList) {
            if (media.idMal) {
                metadataMap.set(media.idMal, media);
            }
        }

        const enrichedRecommendations = recommendations.map(r => {
            const meta = metadataMap.get(r.id);
            if (meta) {
                return {
                    ...meta,
                    mlScore: r.score
                };
            }
            return { idMal: r.id, mlScore: r.score };
        }).filter(r => r.title); // Remove any that AniList couldn't find metadata for

        res.json(enrichedRecommendations);
    } catch (err: any) {
        console.error('Error generating recommendations:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

export default router;
