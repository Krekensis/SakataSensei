import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch, cookies }) => {
    const code = url.searchParams.get("code");
    const codeVerifier = cookies.get("mal_code_verifier");

    if (!code || !codeVerifier) {
        return {
            error: "Missing required parameters",
            details: { code: !!code, verifier: !!codeVerifier }
        };
    }

    cookies.set("mal_code_verifier", "", { path: "/", expires: new Date(0) });

    const clientId = import.meta.env.VITE_MYANIMELIST_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_MYANIMELIST_SECRET;
    const redirectUri = import.meta.env.VITE_MYANIMELIST_REDIRECT_URI;

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: clientId,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri
    });

    if (clientSecret) {
        body.append("client_secret", clientSecret);
    }

    try {
        const res = await fetch("https://myanimelist.net/v1/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: body.toString()
        });

        const responseText = await res.text();
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (e) {
            return {
                error: "Invalid response from MAL",
                details: {
                    status: res.status,
                    response: responseText
                }
            };
        }

        if (!res.ok) {
            return {
                error: data.error || "Failed to exchange code for token",
                details: {
                    status: res.status,
                    error_description: data.error_description,
                    hint: data.hint
                }
            };
        }

        console.log(data)
        if (data.access_token) {
            console.log("MAL Token Response:", data.access_token);

            cookies.set('mal_token', data.access_token, {
                httpOnly: true,
                secure: import.meta.env.PROD,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7  // 7 days
            });

            return {
                success: true,
                token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in,
                token_type: data.token_type
            };
        } else {
            return {
                error: "No access token in response",
                details: data
            };
        }
    } catch (err) {
        return {
            error: "Network error during token exchange",
            details: err instanceof Error ? err.message : String(err)
        };
    }
};