export interface Anime {
  id: number;
  title: {
    romaji: string;
    english?: string;
    native: string;
  };
  coverImage: {
    large: string;
    color?: string;
  };
  description?: string;
  genres: string[];
  averageScore?: number;
  episodes?: number;
}

export interface UserAnimeListEntry {
  anime: Anime;
  score: number;
  status: string;
  progress: number;
}

export interface Recommendation {
  anime: Anime;
  reason: string;
  similarityScore?: number;
}