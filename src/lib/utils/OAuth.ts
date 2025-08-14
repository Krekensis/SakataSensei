import Cookies from "js-cookie";

export function OAuth(type: string) {
    if (type === "AniList") {
        connectAniList();
    } else if (type === "MyAnimeList") {
        connectMyAnimeList();
    } else {
        throw new Error(`Unsupported OAuth type: ${type}`);
    }
}

function goTo(path: string) {
    window.location.href = path;
}

function connectAniList() {
    const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_ANILIST_REDIRECT_URI;
    const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    goTo(authUrl);
}

function generateCodeVerifier(length = 128): string {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let verifier = "";
    for (let i = 0; i < length; i++) {
        verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return verifier;
}

function connectMyAnimeList() {
    const clientId = import.meta.env.VITE_MYANIMELIST_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_MYANIMELIST_REDIRECT_URI;

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = codeVerifier;

    //cookie instead of sessionStorage
    Cookies.set("mal_code_verifier", codeVerifier, {
        
        expires: 1/24,
        secure: import.meta.env.VERSION_TYPE === "test" ? false : true,
        sameSite: 'Lax',
        path: '/'
    });;

    const authUrl = `https://myanimelist.net/v1/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=plain`;

    goTo(authUrl);
}