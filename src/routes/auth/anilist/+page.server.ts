import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch }) => {

    const code = url.searchParams.get("code");

    if (!code) {
        return { error: "Missing authorization code" };
    }

    const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_ANILIST_SECRET;
    const redirectUri = import.meta.env.VITE_ANILIST_REDIRECT_URI;

    const res = await fetch("https://anilist.co/api/v2/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            grant_type: "authorization_code",
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code
        })
    });

    const data = await res.json();

    if (data.access_token) {
        console.log("Anilist Token Response:", data.access_token);
        return { token: data.access_token };
    } else {
        return { error: "Failed to retrieve token", details: data };
    }
};
