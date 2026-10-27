import { useEffect, useState } from "react";
import type { LyricLine, Track } from "../types";
import { fetchLyrics } from "../services/lyrics";
import { useLyricsIndex } from "../store/lyricsIndexStore";

interface LyricsState {
  status: "idle" | "loading" | "done" | "error";
  synced: LyricLine[];
  plain: string | null;
}

interface StoredResult extends LyricsState {
  trackId: number;
}

const IDLE: LyricsState = { status: "idle", synced: [], plain: null };
const LOADING: LyricsState = { status: "loading", synced: [], plain: null };

export function useLyrics(track: Track | null): LyricsState {
  const [result, setResult] = useState<StoredResult | null>(null);

  useEffect(() => {
    if (!track) return;

    const controller = new AbortController();

    fetchLyrics(track, controller.signal)
      .then((r) => {
        setResult({ trackId: track.id, status: "done", ...r });
        if (track.source === "local") {
          useLyricsIndex.getState().save(track.id, r);
        }
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") {
          setResult({ trackId: track.id, status: "error", synced: [], plain: null });
        }
      });

    return () => controller.abort();
  }, [track]);

  if (!track) return IDLE;
  if (!result || result.trackId !== track.id) return LOADING;
  return result;
}