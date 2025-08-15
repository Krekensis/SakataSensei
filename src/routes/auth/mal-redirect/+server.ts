import type { RequestHandler } from './$types';

function generateCodeVerifier(length = 128): string {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let verifier = "";
    for (let i = 0; i < length; i++) {
        verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return verifier;
}

export const GET: RequestHandler = async ({ cookies }) => {
    const clientId = import.meta.env.VITE_MYANIMELIST_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_MYANIMELIST_REDIRECT_URI;

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = codeVerifier; 
    
    cookies.set("mal_code_verifier", codeVerifier, {
        httpOnly: true,
        path: "/",
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 60 * 5 // 5 minutes
    });

    const authUrl = `https://myanimelist.net/v1/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=plain`;

    return new Response(null, {
        status: 302,
        headers: { Location: authUrl }
    });
};
