import type { LyricLine, Track } from "../types";
import { parseLrc } from "../utils/lrc";

const BASE_URL = "https://lrclib.net/api";

interface LrcLibItem {
  duration?: number;
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

export interface LyricsResult {
  synced: LyricLine[];
  plain: string | null;
}

const EMPTY: LyricsResult = { synced: [], plain: null };

// cache lagu yang sama tidak di-fetch ulang
const cache = new Map<number, LyricsResult>();

function toResult(r: LrcLibItem | null | undefined): LyricsResult {
  if (!r) return EMPTY;
  return {
    synced: r.syncedLyrics ? parseLrc(r.syncedLyrics) : [],
    plain: r.plainLyrics,
  };
}

const hasLyrics = (r: LyricsResult) => r.synced.length > 0 || !!r.plain;

// "Song (feat. X) - Remastered" -> "Song"
function cleanTitle(title: string): string {
  return title
    .replace(/\s*[([].*?[)\]]/g, "")
    .replace(/\s*-\s*(Remaster|Live|Single|Radio|Deluxe).*$/i, "")
    .trim();
}

// "A & B", "A, B", "A feat. B" -> "A"
function mainArtist(artist: string): string {
  return artist.split(/\s*(?:&|,|\/|\bfeat\.?|\bft\.?)\s*/i)[0].trim();
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

async function getJson<T>(
  url: string,
  signal?: AbortSignal,
  retries = 2
): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { signal });
    if (res.ok) return (await res.json()) as T;
    if (res.status === 404) return null;
    if (attempt < retries) await sleep(700 * (attempt + 1), signal);
  }
  throw new Error("LRCLIB sedang bermasalah");
}

// Dari banyak kandidat, pilih yang punya lirik sinkron & durasi paling dekat
function pickBest(list: LrcLibItem[], durationSec: number): LrcLibItem | undefined {
  const score = (i: LrcLibItem) =>
    (i.syncedLyrics ? 0 : 1000) + Math.abs((i.duration ?? 0) - durationSec);

  return list
    .filter((i) => i.syncedLyrics || i.plainLyrics)
    .sort((a, b) => score(a) - score(b))[0];
}

export async function fetchLyrics(
  track: Track,
  signal?: AbortSignal
): Promise<LyricsResult> {
  const cached = cache.get(track.id);
  if (cached) return cached;

  const durationSec = Math.round(track.durationMs / 1000);
  const title = cleanTitle(track.title);
  const artist = mainArtist(track.artist);
  let serverFailed = false;

  const attempt = async (fn: () => Promise<LyricsResult>) => {
    try {
      const r = await fn();
      if (hasLyrics(r)) {
        cache.set(track.id, r);
        return r;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
      serverFailed = true; // lanjut ke strategi berikutnya
    }
    return null;
  };

  // persis
  const exact = await attempt(async () => {
    const p = new URLSearchParams({
      track_name: track.title,
      artist_name: track.artist,
      duration: String(durationSec),
    });
    // album hanya dikirim kalau berarti (bukan placeholder)
    if (track.album && track.album !== "Single" && track.album !== "File Lokal") {
      p.set("album_name", track.album);
    }
    return toResult(await getJson<LrcLibItem>(`${BASE_URL}/get?${p}`, signal, 1));
  });
  if (exact) return exact;

  // cari dengan judul & artis utama yang sudah dibersihkan
  const bySearch = await attempt(async () => {
    const p = new URLSearchParams({ track_name: title, artist_name: artist });
    const list = await getJson<LrcLibItem[]>(`${BASE_URL}/search?${p}`, signal);
    return toResult(pickBest(list ?? [], durationSec));
  });
  if (bySearch) return bySearch;

  // pencarian bebas (q=)
  const byQuery = await attempt(async () => {
    const p = new URLSearchParams({ q: `${title} ${artist}` });
    const list = await getJson<LrcLibItem[]>(`${BASE_URL}/search?${p}`, signal);
    return toResult(pickBest(list ?? [], durationSec));
  });
  if (byQuery) return byQuery;

  if (serverFailed) throw new Error("LRCLIB sedang bermasalah");
  return EMPTY;
}