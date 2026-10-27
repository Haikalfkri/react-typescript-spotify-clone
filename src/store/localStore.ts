import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Track } from "../types";
import { deleteAudio } from "../services/localDb";
import { useLibraryStore } from "./libraryStore";
import { useLyricsIndex } from "./lyricsIndexStore";

interface LocalState {
  tracks: Track[];
  addTracks: (tracks: Track[]) => void;
  removeTrack: (track: Track) => void;
}

export const useLocalStore = create<LocalState>()(
  persist(
    (set) => ({
      tracks: [],

      addTracks: (newTracks) =>
        set((s) => {
          const ids = new Set(newTracks.map((t) => t.id));
          return { tracks: [...newTracks, ...s.tracks.filter((t) => !ids.has(t.id))] };
        }),

      removeTrack: (track) => {
        void deleteAudio(track.id); // hapus file dari IndexedDB
        useLibraryStore.getState().purgeTrack(track.id); // hapus dari like/history/playlist
        useLyricsIndex.getState().remove(track.id);
        set((s) => ({ tracks: s.tracks.filter((t) => t.id !== track.id) }));
      },
    }),
    { name: "spotify-clone-local" }
  )
);