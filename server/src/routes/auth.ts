import { Router } from 'express';
import fetch from 'node-fetch'; // using node-fetch to replicate fetch if needed

const router = Router();

// =======================
// ANILIST AUTH
// =======================
router.get('/anilist', async (req, res) => {
    const code = req.query.code as string;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!code) {
        return res.redirect(302, `${frontendUrl}/error?message=Missing+authorization+code`);
    }

    const clientId = process.env.VITE_ANILIST_CLIENT_ID;
    const clientSecret = process.env.VITE_ANILIST_SECRET;
    const redirectUri = process.env.VITE_ANILIST_REDIRECT_URI;

    try {
        const fetchRes = await fetch("https://anilist.co/api/v2/oauth/token", {
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

        const data: any = await fetchRes.json();

        if (data.access_token) {
            res.cookie('anilist_token', data.access_token, {
                httpOnly: true,
                secure: req.secure || process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 * 1000 // 7 days in ms
            });
            return res.redirect(302, `${frontendUrl}/recommend/by-list`);
        } else {
            const errorMessage = data.error || data.message || "Failed to retrieve token";
            return res.redirect(302, `${frontendUrl}/error?message=${encodeURIComponent(errorMessage)}`);
        }
    } catch (err: any) {
        return res.redirect(302, `${frontendUrl}/error?message=${encodeURIComponent("Network error: " + err.message)}`);
    }
});

// =======================
// MAL AUTH REDIRECT
// =======================
function generateCodeVerifier(length = 128): string {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let verifier = "";
    for (let i = 0; i < length; i++) {
        verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return verifier;
}

router.get('/mal-redirect', (req, res) => {
    const clientId = process.env.VITE_MYANIMELIST_CLIENT_ID;
    const redirectUri = process.env.VITE_MYANIMELIST_REDIRECT_URI;

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = codeVerifier;

    res.cookie("mal_code_verifier", codeVerifier, {
        httpOnly: true,
        path: "/",
        secure: req.secure || process.env.NODE_ENV === 'production',
        sameSite: "lax",
        maxAge: 60 * 5 * 1000 // 5 minutes in ms
    });

    const authUrl = `https://myanimelist.net/v1/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri!)}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=plain`;

    res.redirect(302, authUrl);
});

// =======================
// MAL AUTH CALLBACK
// =======================
router.get('/mal', async (req, res) => {
    const code = req.query.code as string;
    const codeVerifier = req.cookies.mal_code_verifier;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!code || !codeVerifier) {
        return res.redirect(302, `${frontendUrl}/error?message=Missing+required+parameters+for+MAL+login`);
    }

    res.clearCookie("mal_code_verifier", { path: "/" });

    const clientId = process.env.VITE_MYANIMELIST_CLIENT_ID;
    const clientSecret = process.env.VITE_MYANIMELIST_SECRET;
    const redirectUri = process.env.VITE_MYANIMELIST_REDIRECT_URI;

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: clientId!,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri!
    });

    if (clientSecret) {
        body.append("client_secret", clientSecret);
    }

    try {
        const fetchRes = await fetch("https://myanimelist.net/v1/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: body.toString()
        });

        const responseText = await fetchRes.text();
        let data: any;
        try {
            data = JSON.parse(responseText);
        } catch (e: any) {
            const errorMessage = e.message || "Invalid response from MAL";
            return res.redirect(302, `${frontendUrl}/error?message=${encodeURIComponent(errorMessage)}`);
        }

        if (!fetchRes.ok) {
            const errorMessage = data.error || "Failed to exchange code for token";
            return res.redirect(302, `${frontendUrl}/error?message=${encodeURIComponent(errorMessage)}`);
        }

        if (data.access_token) {
            res.cookie('mal_token', data.access_token, {
                httpOnly: true,
                secure: req.secure || process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 * 1000 // 7 days
            });

            return res.redirect(302, `${frontendUrl}/recommend/by-list`);
        } else {
            return res.redirect(302, `${frontendUrl}/error?message=No+access+token+in+response`);
        }
    } catch (err: any) {
        return res.redirect(302, `${frontendUrl}/error?message=${encodeURIComponent("Network error: " + err.message)}`);
    }
});

// =======================
// STATUS & LOGOUT
// =======================
router.get('/status', (req, res) => {
    const anilistToken = req.cookies.anilist_token;
    const malToken = req.cookies.mal_token;

    let loginType = 'none';
    let token: string | undefined;
    loginType = Boolean(anilistToken) ? 'AniList' : Boolean(malToken) ? 'MyAnimeList' : 'none';

    if (loginType !== 'none') {
        if (loginType === 'MyAnimeList') {
            token = malToken;
        } else if (loginType === 'AniList') {
            token = anilistToken;
        }
    }

    return res.json({
        isLoggedIn: Boolean(anilistToken) || Boolean(malToken),
        accessToken: token || null,
        loginType: loginType
    });
});

router.post('/logout', (req, res) => {
    res.clearCookie("anilist_token", { path: "/" });
    res.clearCookie("mal_token", { path: "/" });
    return res.status(204).send();
});

export default router;
