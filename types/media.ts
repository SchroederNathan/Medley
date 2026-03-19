export type MediaCastMember = {
  id: string;
  name: string;
  character?: string | null;
  profile_path?: string | null;
  order?: number | null;
};

export type MediaCrewMember = {
  id: string;
  name: string;
  job: string;
  department?: string | null;
  profile_path?: string | null;
};

export type MediaCrewCredits = {
  directors?: MediaCrewMember[];
  producers?: MediaCrewMember[];
  writers?: MediaCrewMember[];
};

export type TvEpisode = {
  episode_number: number;
  name: string;
  overview: string | null;
  still_path: string | null;
  air_date: string | null;
  vote_average: number | null;
  runtime: number | null;
};

export type TvSeason = {
  season_number: number;
  name: string;
  overview: string | null;
  episode_count: number;
  poster_path: string | null;
  air_date: string | null;
  episodes?: TvEpisode[];
};

export type MediaMetadata = {
  popularity: number;
  original_title: string | null;
  cast?: MediaCastMember[];
  crew?: MediaCrewCredits;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  seasons?: TvSeason[];
  created_by?: MediaCrewMember[];
  [key: string]: any;
};

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
    tmdb_id?: number;
    [key: string]: any;
  };
  metadata: MediaMetadata;
  created_at: string;
  updated_at: string;
};
