import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
    const anilistToken = cookies.get('anilist_token');
    const malToken = cookies.get('mal_token');

    let loginType: string = 'none';
    let token: string | undefined;
    loginType = Boolean(anilistToken) ? 'AniList' : Boolean(malToken) ? 'MyAnimeList' : 'none';

    if(loginType !== 'none') {
        if (loginType === 'MyAnimeList') {
            token = malToken;
        } else if (loginType === 'AniList') {
            token = anilistToken;
        }
    }
    
    return new Response(
        JSON.stringify({
            isLoggedIn: Boolean(anilistToken) || Boolean(malToken),
            accessToken: token || null,
            loginType: loginType
        }),
        { headers: { 'Content-Type': 'application/json' } }
    );
};