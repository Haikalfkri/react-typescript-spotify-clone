import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Playlist, Track } from "../types";


interface LibraryState {
    playlists: Playlist[];
    liked: Track[];
    history: Track[];
    offsets: Record<number, number>; // offset sinkron lirik per lagu (detik)

    createPlaylist: (name: string) => string;
    deletePlaylist: (id: string) => void;
    addToPlaylist: (playlistId: string, track: Track) => void;
    removeFromPlaylist: (playlistId: string, trackId: number) => void;
    toggleLike: (track: Track) => void;
    addToHistory: (track: Track) => void;
    clearHistory: () => void;
    setOffset: (trackId: number, value: number) => void;
    purgeTrack: (trackId: number) => void;
}

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set) => ({
            playlists: [],
            liked: [],
            history: [],
            offsets: {},

            createPlaylist: (name) => {
                const id = crypto.randomUUID();
                set((s) => ({
                playlists: [
                    ...s.playlists,
                    { id, name, tracks: [], createdAt: Date.now() },
                ],
                }));
                return id;
            },

            deletePlaylist: (id) =>
                set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

            addToPlaylist: (playlistId, track) =>
                set((s) => ({
                playlists: s.playlists.map((p) =>
                    p.id === playlistId && !p.tracks.some((t) => t.id === track.id)
                    ? { ...p, tracks: [...p.tracks, track] }
                    : p
                ),
            })),

            removeFromPlaylist: (playlistId, trackId) =>
                set((s) => ({
                playlists: s.playlists.map((p) =>
                    p.id === playlistId
                    ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
                    : p
                ),
            })),

            toggleLike: (track) =>
                set((s) => 
                    s.liked.some((t) => t.id === track.id)
                        ? { liked: s.liked.filter((t) => t.id !== track.id) }
                        : { liked: [track, ...s.liked] }
                ),
            
            addToHistory: (track) =>
                set((s) => ({
                history: [track, ...s.history.filter((t) => t.id !== track.id)].slice(0, 50),
            })),

            clearHistory: () => set({ history: [] }),

            purgeTrack: (trackId) =>
                set((s) => ({
                liked: s.liked.filter((t) => t.id !== trackId),
                history: s.history.filter((t) => t.id !== trackId),
                playlists: s.playlists.map((p) => ({
                    ...p,
                    tracks: p.tracks.filter((t) => t.id !== trackId),
                })),
            })),

            setOffset: (trackId, value) =>
                set((s) => ({ offsets: { ...s.offsets, [trackId]: value } })),
        }),
        { name: "spotify-clone-library" }
    )
);