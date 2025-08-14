interface AnimeEntry {
  id: number;
  title: string;
  englishTitle: string | null;
  genres: string[];
  score: number;
  scoreFormat: string;
  status: 'COMPLETED' | 'CURRENT' | 'PLANNING';
  repeat: number;
  format: string;
  episodes: number | null;
  year: number | null;
  season: string | null;
  averageScore: number;
  popularity: number;
  studios: string[];
  tags: Array<{
    name: string;
    rank: number;
  }>;
  source: string;
}

interface ImportResult {
  completed: AnimeEntry[];
  current: AnimeEntry[];
  planning: AnimeEntry[];
  userScoreFormat: string;
  totalEntries: number;
}

export async function fetchAniList(token: string): Promise<ImportResult> {
  const query = `
    query {
      Viewer {
        mediaListOptions {
          scoreFormat
        }
      }
      MediaListCollection(type: ANIME, status_in: [COMPLETED, CURRENT, PLANNING]) {
        lists {
          status
          entries {
            id
            score
            repeat
            media {
              id
              title {
                romaji
                english
              }
              format
              episodes
              startDate {
                year
              }
              season
              genres
              averageScore
              popularity
              source
              tags {
                name
                rank
              }
              studios(isMain: true) {
                nodes {
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      throw new Error(`GraphQL error: ${data.errors.map((e: any) => e.message).join(', ')}`);
    }

    const viewer = data.data?.Viewer;
    const lists = data.data?.MediaListCollection?.lists;

    if (!viewer || !lists) {
      throw new Error('Invalid response structure from AniList API');
    }

    const result: ImportResult = {
      completed: [],
      current: [],
      planning: [],
      userScoreFormat: viewer.mediaListOptions.scoreFormat,
      totalEntries: 0
    };

    lists.forEach((list: any) => {
      const entries: AnimeEntry[] = list.entries.map((entry: any) => ({
        id: entry.media.id,
        title: entry.media.title.romaji,
        englishTitle: entry.media.title.english,
        genres: entry.media.genres || [],
        score: entry.score || 0,
        scoreFormat: viewer.mediaListOptions.scoreFormat,
        status: list.status,
        repeat: entry.repeat || 0,
        format: entry.media.format,
        episodes: entry.media.episodes,
        year: entry.media.startDate?.year || null,
        season: entry.media.season,
        averageScore: entry.media.averageScore || 0,
        popularity: entry.media.popularity || 0,
        studios: entry.media.studios?.nodes?.map((studio: any) => studio.name) || [],
        tags: entry.media.tags?.map((tag: any) => ({
          name: tag.name,
          rank: tag.rank
        })) || [],
        source: entry.media.source
      }));

      switch (list.status) {
        case 'COMPLETED':
          result.completed = entries;
          break;
        case 'CURRENT':
          result.current = entries;
          break;
        case 'PLANNING':
          result.planning = entries;
          break;
      }

      result.totalEntries += entries.length;
    });

    return result;

  } catch (error) {
    console.error('Error fetching AniList data:', error);
    throw error;
  }
}

// Alternative function with better error handling and debugging
export async function fetchAniListWithDebug(token: string): Promise<ImportResult> {
  // First, test with a simple query to verify authentication
  const testQuery = `
    query {
      Viewer {
        id
        name
        mediaListOptions {
          scoreFormat
        }
      }
    }
  `;

  try {
    console.log('Testing authentication...');
    const testResponse = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: testQuery })
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      throw new Error(`Authentication failed: ${testResponse.status} - ${errorText}`);
    }

    const testData = await testResponse.json();
    if (testData.errors) {
      throw new Error(`Auth test failed: ${testData.errors.map((e: any) => e.message).join(', ')}`);
    }

    console.log('Authentication successful, fetching anime list...');

    // Now fetch the full data
    return fetchAniList(token);

  } catch (error) {
    console.error('Debug function error:', error);
    throw error;
  }
}