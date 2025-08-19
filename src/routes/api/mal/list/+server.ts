import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, request }) => {
    const token = request.headers.get("Authorization");

    if (!token) {
        return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401 });
    }

    const baseUrl = "https://api.myanimelist.net/v2/users/@me/animelist";
    const fields = [
        "id", 
        "title", 
        "alternative_titles", 
        "start_date", 
        "num_episodes",
        "num_list_users",
        "num_scoring_users",
        "media_type", 
        "mean", 
        "popularity", 
        "studios", 
        "genres", 
        "status", 
        "source", 
        "start_season", 
        "average_episode_duration",
        "my_list_status"
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
                return new Response(
                    JSON.stringify({ error: `MAL fetch failed: ${response.status}`, details: errText }),
                    { status: response.status }
                );
            }

            const data = await response.json();
            if (!data.data) break;

            allEntries.push(...data.data);
            nextPage = data.paging?.next || null;
        }

        return new Response(JSON.stringify({ entries: allEntries }), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
