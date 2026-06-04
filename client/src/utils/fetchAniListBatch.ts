export async function fetchAniListBatch(malIds: number[]): Promise<any[]> {
    if (!malIds || malIds.length === 0) return [];

    const query = `
    query ($idMalIn: [Int]) {
        Page(page: 1, perPage: 50) {
            media(idMal_in: $idMalIn, type: ANIME) {
                id
                idMal
                title {
                    romaji
                    english
                    native
                }
                description
                format
                status
                startDate { year }
                episodes
                countryOfOrigin
                coverImage {
                    extraLarge
                    large
                    color
                }
                bannerImage
                genres
                averageScore
                popularity
                isAdult
                tags { name }
                studios(isMain: true) { nodes { name } }
                relations {
                    edges {
                        relationType
                        node { idMal }
                    }
                }
            }
        }
    }`;

    // Split malIds into chunks of 50
    const chunkSize = 50;
    const chunks: number[][] = [];
    for (let i = 0; i < malIds.length; i += chunkSize) {
        chunks.push(malIds.slice(i, i + chunkSize));
    }

    const fetchPromises = chunks.map(async (chunk) => {
        try {
            const res = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: { idMalIn: chunk }
                })
            });

            if (!res.ok) {
                console.error("AniList fetch failed for chunk", res.status);
                return [];
            }

            const data = await res.json();
            return data?.data?.Page?.media || [];
        } catch (e) {
            console.error("Error fetching chunk", e);
            return [];
        }
    });

    const results = await Promise.all(fetchPromises);
    // Flatten array of arrays
    return results.flat();
}
