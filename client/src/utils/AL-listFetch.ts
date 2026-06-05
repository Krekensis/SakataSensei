interface AnimeEntry {
    id: number;
    idAl: number;
    title: string;
    englishTitle: string | null;
    genres: string[];
    score: number;
    scoreFormat: string;
    imageUrl?: string;
    bannerImageUrl?: string | null;
    status: 'COMPLETED' | 'CURRENT' | 'PLANNING' | 'DROPPED' | 'PAUSED';
    format: string;
    episodes: number | null;
    year: number | null;
    season: string | null;
    meanScore: number;
    members: number;
    studios: string[];
    tags: string[];
    source: string;
    isAdult: boolean;
}

interface ImportResult {
    completed: AnimeEntry[];
    current: AnimeEntry[];
    planning: AnimeEntry[];
    dropped: AnimeEntry[];
    onHold: AnimeEntry[];
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
                        MediaListCollection(userId: ${viewerId}, type: ANIME, status_in: [COMPLETED, CURRENT, PLANNING, DROPPED, PAUSED]) {
                            lists {
                                status
                                entries {
                                    id
                                    score
                                    repeat
                                    media {
                                        id
                                        idMal
                                        title {
                                            romaji
                                            english
                                        }
                                        format
                                        episodes
                                        startDate {
                                            year
                                        }
                                        coverImage {
                                            large
                                        }
                                        bannerImage
                                        season
                                        genres
                                        meanScore
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
                                        isAdult
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
            dropped: [],
            onHold: [],
            userScoreFormat: viewer.mediaListOptions.scoreFormat,
            totalEntries: 0
        };

        lists.forEach((list: any) => {
            const entries: AnimeEntry[] = list.entries.map((entry: any) => ({
                id: entry.media.idMal || 0,
                idAL: entry.media.id || 0,
                title: entry.media.title.romaji,
                englishTitle: entry.media.title.english,
                genres: entry.media.genres || [],
                score: entry.score || 0,
                scoreFormat: viewer.mediaListOptions.scoreFormat,
                imageUrl: entry.media.coverImage?.large || null,
                bannerImageUrl: entry.media.bannerImage || null,
                status: list.status,
                format: entry.media.format,
                episodes: entry.media.episodes,
                year: entry.media.startDate?.year || null,
                season: entry.media.season,
                meanScore: entry.media.meanScore || 0,
                members: entry.media.popularity || 0,
                studios: entry.media.studios?.nodes?.map((studio: any) => studio.name) || [],
                tags: entry.media.tags?.sort((a: any, b: any) => (b.rank ?? 0) - (a.rank ?? 0)).map((tag: any) => tag.name) || [],
                source: entry.media.source,
                isAdult: entry.media.isAdult || false
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
                case 'DROPPED':
                    result.dropped = entries;
                    break;
                case 'PAUSED':
                    result.onHold = entries;
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