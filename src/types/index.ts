export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  cover: string;
  previewUrl: string;
  durationMs: number;
  genre: string;
  source?: "local";
}

export interface Playlist {
    id: string;
    name: string;
    tracks: Track[];
    createdAt: number;
}

export interface LyricLine  {
    time: number; // detik
    text: string;
}