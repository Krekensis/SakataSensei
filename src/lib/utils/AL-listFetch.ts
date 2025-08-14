interface AnimeEntry {
    id: number;
    title: string;
    englishTitle: string | null;
    genres: string[];
    score: number;
    scoreFormat: string;
    status: 'COMPLETED' | 'CURRENT' | 'PLANNING';
    repeat: number;
    format: string;
    episodes: number | null;
    year: number | null;
    season: string | null;
    averageScore: number;
    popularity: number;
    studios: string[];
    tags: Array<{
        name: string;
        rank: number;
    }>;
    source: string;
}

interface ImportResult {
    completed: AnimeEntry[];
    current: AnimeEntry[];
    planning: AnimeEntry[];
    userScoreFormat: string;
    totalEntries: number;
}

export async function fetchAniListId(token: string): Promise<ImportResult> {
    const idQuery = `query { Viewer { id } }`;

    try {
        console.log('Testing authentication...');
        const idResponse = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query: idQuery })
        });

        if (!idResponse.ok) {
            const errorText = await idResponse.text();
            throw new Error(`Authentication failed: ${idResponse.status} - ${errorText}`);
        }

        const idData = await idResponse.json();
        if (idData.errors) {
            throw new Error(`Auth test failed: ${idData.errors.map((e: any) => e.message).join(', ')}`);
        }

        let viewerId = idData.data?.Viewer?.id;
        if (!viewerId) {
            throw new Error('Failed to retrieve viewer ID from AniList');
        }
        console.log('Authentication successful, fetching anime list...');
        return fetchAniList(token, viewerId);

    } catch (error) {
        console.error('Debug function error:', error);
        throw error;
    }
}

export async function fetchAniList(token: string, viewerId: string): Promise<ImportResult> {
    const query = `
                    query {
                        Viewer {
                            id
                            name
                            mediaListOptions { scoreFormat }
                        }
                        MediaListCollection(userId: ${viewerId}, type: ANIME, status_in: [COMPLETED, CURRENT, PLANNING]) {
                            lists {
                                status
                                entries {
                                    id
                                    score
                                    repeat
                                    media {
                                        id
                                        title {
                                            romaji
                                            english
                                        }
                                        format
                                        episodes
                                        startDate {
                                            year
                                        }
                                        season
                                        genres
                                        averageScore
                                        popularity
                                        source
                                        tags {
                                            name
                                            rank
                                        }
                                        studios(isMain: true) {
                                            nodes {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const data = await response.json();

        if (data.errors) {
            console.error('GraphQL Errors:', data.errors);
            throw new Error(`GraphQL error: ${data.errors.map((e: any) => e.message).join(', ')}`);
        }

        const viewer = data.data?.Viewer;
        const lists = data.data?.MediaListCollection?.lists;

        if (!viewer || !lists) {
            throw new Error('Invalid response structure from AniList API');
        }

        const result: ImportResult = {
            completed: [],
            current: [],
            planning: [],
            userScoreFormat: viewer.mediaListOptions.scoreFormat,
            totalEntries: 0
        };

        lists.forEach((list: any) => {
            const entries: AnimeEntry[] = list.entries.map((entry: any) => ({
                id: entry.media.id,
                title: entry.media.title.romaji,
                englishTitle: entry.media.title.english,
                genres: entry.media.genres || [],
                score: entry.score || 0,
                scoreFormat: viewer.mediaListOptions.scoreFormat,
                status: list.status,
                repeat: entry.repeat || 0,
                format: entry.media.format,
                episodes: entry.media.episodes,
                year: entry.media.startDate?.year || null,
                season: entry.media.season,
                averageScore: entry.media.averageScore || 0,
                popularity: entry.media.popularity || 0,
                studios: entry.media.studios?.nodes?.map((studio: any) => studio.name) || [],
                tags: entry.media.tags?.map((tag: any) => ({
                    name: tag.name,
                    rank: tag.rank
                })) || [],
                source: entry.media.source
            }));

            switch (list.status) {
                case 'COMPLETED':
                    result.completed = entries;
                    break;
                case 'CURRENT':
                    result.current = entries;
                    break;
                case 'PLANNING':
                    result.planning = entries;
                    break;
            }

            result.totalEntries += entries.length;
        });

        return result;

    } catch (error) {
        console.error('Error fetching AniList data:', error);
        throw error;
    }
}