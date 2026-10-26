import { useEffect, useRef, useState } from "react";
import { ListPlus } from "lucide-react";
import type { Track } from "../types";
import { useLibraryStore } from "../store/libraryStore";

export default function AddToPlaylist({ track }: { track: Track }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const playlists = useLibraryStore((s) => s.playlists);
  const addToPlaylist = useLibraryStore((s) => s.addToPlaylist);
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);

  // tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNew = () => {
    const name = window.prompt("Nama playlist baru:");
    if (name && name.trim()) {
      const id = createPlaylist(name.trim());
      addToPlaylist(id, track);
      setOpen(false);
    }
  };

  return (
    // stopPropagation supaya klik di sini tidak ikut memutar lagu
    <div className="add-pl" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        title="Tambah ke playlist"
        aria-label="Tambah ke playlist"
      >
        <ListPlus size={20} />
      </button>

      {open && (
        <div className="dropdown">
          <button className="dropdown-item" onClick={handleNew}>
            + Playlist baru
          </button>
          {playlists.map((p) => (
            <button
              key={p.id}
              className="dropdown-item"
              onClick={() => {
                addToPlaylist(p.id, track);
                setOpen(false);
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}