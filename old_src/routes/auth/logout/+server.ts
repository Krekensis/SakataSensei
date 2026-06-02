import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {

    cookies.set("anilist_token", "", { path: "/", expires: new Date(0) });
    cookies.set("mal_token", "", { path: "/", expires: new Date(0) });

    return new Response(null, { status: 204 });
};