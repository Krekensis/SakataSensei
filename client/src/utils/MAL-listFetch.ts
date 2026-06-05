interface AnimeEntry {
    id: number;
    title: string;
    englishTitle: string | null;
    genres: string[];
    score: number;
    scoreFormat: string;
    imageUrl?: string;
    bannerImageUrl?: null;
    status: 'COMPLETED' | 'CURRENT' | 'PLANNING' | 'OTHER';
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
export async function fetchMALList(token: string): Promise<ImportResult> {
    const result: ImportResult = {
        completed: [],
        current: [],
        planning: [],
        dropped: [],
        onHold: [],
        userScoreFormat: "POINT_10",
        totalEntries: 0
    };

    let nextUrl: string | null = "/api/mal/list";

    try {
        while (nextUrl) {
            const response = await fetch(nextUrl, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }

            const { entries, paging } = await response.json();
            console.log("MAL Page Entries:", entries.length, "Next:", paging?.next);

            for (const entry of entries) {
                const anime = entry.node;
                const status = anime.my_list_status.status.toUpperCase();

                const mapped: AnimeEntry = {
                    id: anime.id,
                    title: anime.title,
                    englishTitle: anime.alternative_titles?.en || null,
                    genres: anime.genres?.map((g: any) => g.name) || [],
                    score: anime.my_list_status.score || 0,
                    scoreFormat: "POINT_10",
                    imageUrl: anime.main_picture?.large || null,
                    bannerImageUrl: null,
                    status:
                        status === "COMPLETED" ? "COMPLETED" :
                        status === "WATCHING" ? "CURRENT" :
                        status === "PLAN_TO_WATCH" ? "PLANNING" :
                        status === "DROPPED" ? "DROPPED" :
                        status === "ON_HOLD" ? "PAUSED" :
                        "OTHER",
                    format: anime.media_type || "UNKNOWN",
                    episodes: anime.num_episodes || null,
                    year: anime.start_season?.year || null,
                    season: anime.start_season?.season?.toUpperCase() || null,
                    meanScore: anime.mean ? anime.mean * 10 : 0,
                    members: anime.num_list_users || 0,
                    studios: anime.studios?.map((s: any) => s.name) || [],
                    tags: [],
                    source: anime.source || "UNKNOWN",
                    isAdult: anime.rating === "rx" || anime.rating === "r+" || (anime.genres?.some((g: any) => g.name.toLowerCase() === 'hentai' || g.name.toLowerCase() === 'erotica')) || false
                };

                if (mapped.status === "COMPLETED") result.completed.push(mapped);
                else if (mapped.status === "CURRENT") result.current.push(mapped);
                else if (mapped.status === "PLANNING") result.planning.push(mapped);
                else if (mapped.status === "DROPPED") result.dropped.push(mapped);
                else if (mapped.status === "PAUSED") result.onHold.push(mapped);

                result.totalEntries++;
            }

            nextUrl = paging?.next || null;
        }

        return result;
    } catch (err) {
        console.error("Error fetching MAL data:", err);
        throw err;
    }
}

