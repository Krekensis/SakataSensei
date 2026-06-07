import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

// =======================
// TRENDING ANIME
// =======================
router.get('/trending', async (req, res) => {
    const query = `
        query {
            Page(perPage: 20) {
                media(type: ANIME, sort: TRENDING_DESC) {
                    id
                    title {
                        romaji
                        english
                    }
                    coverImage {
                        extraLarge
                        color
                    }
                    format
                    startDate {
                        year
                    }
                    averageScore
                    meanScore
                    status
                }
            }
        }`;

    try {
        const fetchRes = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
        });

        const data: any = await fetchRes.json();
        return res.json(data.data.Page.media);
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch trending", details: err.message });
    }
});

// =======================
// MAL LIST
// =======================
router.get('/mal/list', async (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: "Missing Authorization header" });
    }

    const baseUrl = "https://api.myanimelist.net/v2/users/@me/animelist";
    const fields = [
        "id", "title", "alternative_titles", "start_date", "num_episodes",
        "num_list_users", "num_scoring_users", "media_type", "mean",
        "popularity", "studios", "genres", "status", "source",
        "start_season", "average_episode_duration", "my_list_status"
    ].join(",");

    let nextPage: string | null = `${baseUrl}?fields=${fields}&limit=100`;
    const allEntries: any[] = [];

    try {
        while (nextPage) {
            const response = await fetch(nextPage, {
                headers: {
                    "Authorization": token // token already includes "Bearer ..."
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                return res.status(response.status).json({
                    error: `MAL fetch failed: ${response.status}`,
                    details: errText
                });
            }

            const data: any = await response.json();
            if (!data.data) break;

            allEntries.push(...data.data);
            nextPage = data.paging?.next || null;
        }

        return res.json({ entries: allEntries });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// =======================
// MAL LIST UPDATE (PROXY)
// =======================
router.post('/mal/update_status', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: "Missing Authorization header" });
    }

    const { anime_id, status } = req.body;
    if (!anime_id || !status) {
        return res.status(400).json({ error: "Missing anime_id or status" });
    }

    const url = `https://api.myanimelist.net/v2/anime/${anime_id}/my_list_status`;

    // MAL requires x-www-form-urlencoded for PATCH
    const formData = new URLSearchParams();
    formData.append('status', status);

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                "Authorization": token, // Token already includes "Bearer ..."
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData.toString()
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({
                error: `MAL update failed: ${response.status}`,
                details: errText
            });
        }

        const data: any = await response.json();
        return res.json({ success: true, data });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
