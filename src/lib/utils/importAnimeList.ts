import { fetchAniListWithDebug } from './AL-listFetch';
import { fetchMALList } from './MAL-listFetch';

export async function importAnimeList(loginType: string, accessToken: string){
  if (loginType === 'MyAnimeList') {
    return await fetchMALList(accessToken);
  } else if (loginType === 'AniList') {
    return await fetchAniListWithDebug(accessToken);
  }
  else {throw new Error(`Unsupported loginType: ${loginType}`)};
}
