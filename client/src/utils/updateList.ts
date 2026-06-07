export async function addAnimeToPlanningList(animeId: number, loginType: string, accessToken: string): Promise<boolean> {
    if (!accessToken || loginType === 'none') {
        console.error("User is not logged in");
        return false;
    }

    try {
        if (loginType === 'AniList') {
            const query = `
                mutation ($mediaId: Int, $status: MediaListStatus) {
                    SaveMediaListEntry (mediaId: $mediaId, status: $status) {
                        id
                        status
                    }
                }
            `;
            const variables = {
                mediaId: animeId,
                status: 'PLANNING'
            };

            const response = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`AniList mutation failed: ${err}`);
            }

            return true;

        } else if (loginType === 'MyAnimeList') {
            const response = await fetch('/api/mal/update_status', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    anime_id: animeId,
                    status: 'plan_to_watch'
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`MAL proxy mutation failed: ${err}`);
            }

            return true;
        }

        return false;
    } catch (error) {
        console.error("Error adding to list:", error);
        return false;
    }
}
