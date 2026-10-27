import type { Track } from "../types";

interface ITunesResult {
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName: string;
    artworkUrl100: string;
    previewUrl?: string;
    trackTimeMillis?: number;
    primaryGenreName: string;
}

const BASE_URL = "https://itunes.apple.com/search";

function mapTrack(r: ITunesResult): Track {
    return {
        id: r.trackId,
        title: r.trackName,
        artist: r.artistName,
        album: r.collectionName ?? "Single",
        cover: r.artworkUrl100.replace("100x100bb", "400x400bb"),
        previewUrl: r.previewUrl ?? "",
        durationMs: r.trackTimeMillis ?? 0,
        genre: r.primaryGenreName,
    };
}

export async function searchTracks(
  term: string,
  limit = 24,
  signal?: AbortSignal
): Promise<Track[]> {
  const url = `${BASE_URL}?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Gagal mengambil data lagu");

  const data: { results: ITunesResult[] } = await res.json();
  return data.results.filter((r) => r.previewUrl).map(mapTrack);
}