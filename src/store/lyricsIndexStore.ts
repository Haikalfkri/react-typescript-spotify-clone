import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LyricsResult } from "../services/lyrics";

export interface IndexedLine {
    t: number;
    s: string;
}

interface indexState {
    entries: Record<number, IndexedLine[]>;
    save: (trackId: number, lyrics: LyricsResult) => void;
    remove: (trackId: number) => void;
}

function toLines(l: LyricsResult): IndexedLine[] {
  if (l.synced.length > 0) {
    return l.synced
      .filter((x) => x.text.trim())
      .map((x) => ({ t: Math.round(x.time * 10) / 10, s: x.text.trim() }));
  }
  if (l.plain) {
    return l.plain
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ t: -1, s }));
  }
  return [];
}

export const useLyricsIndex = create<indexState>() (
    persist(
        (set) => ({
            entries: {},
            save: (trackId, lyrics) =>
                set((s) => ({ entries: { ...s.entries, [trackId]: toLines(lyrics) } })),

            remove: (trackId) =>
                set((s) => {
                const next = { ...s.entries };
                delete next[trackId];
                return { entries: next };
            }),
        }),
        { name: "spotify-clone-lyrics-index" }
    )
)