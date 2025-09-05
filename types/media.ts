export type Media = {
  id: string;
  title: string;
  media_type: string;
  description: string;
  genres: string[];
  year: number;
  rating_average: number;
  rating_count: number;
  poster_url: string;
  backdrop_url: string;
  duration_minutes: number;
  external_ids: {
    tmdb_id: number;
    [key: string]: any;
  };
  metadata: {
    popularity: number;
    original_title: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
};