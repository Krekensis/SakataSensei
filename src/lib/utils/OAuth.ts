import Cookies from "js-cookie";
function goTo(path: string) {
    window.location.href = path;
}

export function OAuth(type: string) {
    if (type === "AniList") {
        connectAniList();
    } else if (type === "MyAnimeList") {
        connectMyAnimeList();
    } else {
        throw new Error(`Unsupported OAuth type: ${type}`);
    }
}

function connectAniList() {
    const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_ANILIST_REDIRECT_URI;
    const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    goTo(authUrl);
}

function connectMyAnimeList() {
    goTo("/auth/mal-redirect");
}