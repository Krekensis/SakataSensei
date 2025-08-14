export async function fetchMALList(token: string){
  const resp = await fetch(
    'https://api.myanimelist.net/v2/users/@me/animelist?fields=list_status,num_episodes',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await resp.json();

  return {
    loginType: 'MyAnimeList',
    username: data.paging?.previous || 'MAL User', // MAL user info is a separate endpoint
    data
  };
}
