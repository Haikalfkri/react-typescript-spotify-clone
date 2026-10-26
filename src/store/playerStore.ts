import { create } from "zustand";
import type { Track } from "../types";
import { useLibraryStore } from "./libraryStore";
import { getLocalAudioUrl } from "../services/localDb";

const audio = new Audio();
audio.preload = "auto";
audio.volume = 0.8;

export const getAudioTime = () => audio.currentTime;

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  current: Track | null;
  queue: Track[];
  index: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  lyricsOpen: boolean;

  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setLyricsOpen: (open: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Token untuk membatalkan pemuatan lama kalau user cepat-cepat ganti lagu
  let playToken = 0;

  const startAt = (index: number) => {
    const track = get().queue[index];
    if (!track) return;

    const token = ++playToken;
    set({ current: track, index, currentTime: 0, duration: 0 });

    const begin = (src: string) => {
      audio.src = src;
      audio.play().catch(() => set({ isPlaying: false }));
      useLibraryStore.getState().addToHistory(track);
    };

    // Lagu iTunes: URL langsung
    if (track.source !== "local") {
      begin(track.previewUrl);
      return;
    }

    // Lagu lokal: ambil file dari IndexedDB dulu
    getLocalAudioUrl(track.id).then((url) => {
      if (token !== playToken) return; // sudah ganti lagu, abaikan
      if (url) {
        begin(url);
      } else {
        set({ isPlaying: false });
        window.alert(`File "${track.title}" tidak ditemukan. Upload ulang di halaman File Lokal.`);
      }
    });
  };

  // sinkronkan state dengan event dari <audio>
  audio.addEventListener("timeupdate", () => set({ currentTime: audio.currentTime }));
  audio.addEventListener("loadedmetadata", () => set({ duration: audio.duration }));
  audio.addEventListener("play", () => set({ isPlaying: true }));
  audio.addEventListener("pause", () => set({ isPlaying: false }));
  audio.addEventListener("ended", () => {
    if (get().repeat === "one") {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      get().next(true);
    }
  });

  return {
    current: null,
    queue: [],
    index: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    shuffle: false,
    repeat: "off",
    lyricsOpen: false,

    playTrack: (track, queue) => {
      const newQueue = queue && queue.length > 0 ? queue : [track];
      const idx = newQueue.findIndex((t) => t.id === track.id);
      set({ queue: newQueue });
      startAt(idx === -1 ? 0 : idx);
    },

    togglePlay: () => {
      if (!get().current) return;
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    },

    next: (auto = false) => {
      const { queue, index, shuffle, repeat } = get();
      if (queue.length === 0) return;

      let nextIndex = shuffle
        ? Math.floor(Math.random() * queue.length)
        : index + 1;

      if (nextIndex >= queue.length) {
        // habis queue otomatis berhenti kecuali repeat "all"
        if (auto && repeat !== "all") {
          audio.pause();
          audio.currentTime = 0;
          return;
        }
        nextIndex = 0;
      }
      startAt(nextIndex);
    },

    prev: () => {
      const { queue, index } = get();
      if (queue.length === 0) return;
      // kalau sudah > 3 detik, "prev" mengulang lagu dari awal
      if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }
      startAt(index - 1 < 0 ? queue.length - 1 : index - 1);
    },

    seek: (time) => {
      audio.currentTime = Math.max(0, time);
      set({ currentTime: audio.currentTime });
    },

    setVolume: (v) => {
      audio.volume = v;
      set({ volume: v });
    },

    toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

    cycleRepeat: () =>
      set((s) => ({
        repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
      })),

    setLyricsOpen: (open) => set({ lyricsOpen: open }),
  };
});