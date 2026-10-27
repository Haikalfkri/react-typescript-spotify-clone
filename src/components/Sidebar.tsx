import { NavLink, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Heart,
  History as HistoryIcon,
  Plus,
  ListMusic,
  FolderOpen,
  Quote,
} from "lucide-react";
import { useLibraryStore } from "../store/libraryStore";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "nav-link active" : "nav-link";

export default function Sidebar() {
  const playlists = useLibraryStore((s) => s.playlists);
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);
  const navigate = useNavigate();

  const handleCreate = () => {
    const name = window.prompt("Nama playlist:");
    if (name && name.trim()) {
      const id = createPlaylist(name.trim());
      navigate(`/playlist/${id}`);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-box">
        <h1 className="logo">🎧 Spotify Clone</h1>
        <NavLink to="/" end className={linkClass}>
          <HomeIcon size={22} /> Home
        </NavLink>
        <NavLink to="/search" className={linkClass}>
          <SearchIcon size={22} /> Search
        </NavLink>
      </div>

      <div className="sidebar-box sidebar-library">
        <div className="library-header">
          <span>Your Library</span>
          <button onClick={handleCreate} title="Buat playlist" aria-label="Buat playlist">
            <Plus size={20} />
          </button>
        </div>

        <NavLink to="/liked" className={linkClass}>
          <Heart size={20} /> Liked Songs
        </NavLink>
        <NavLink to="/history" className={linkClass}>
          <HistoryIcon size={20} /> History
        </NavLink>

        <NavLink to="/local" className={linkClass}>
          <FolderOpen size={20} /> File Lokal
        </NavLink>

        <NavLink to="/lyric-search" className={linkClass}>
          <Quote size={20} /> Cari Lirik
        </NavLink>
        {playlists.map((p) => (
          <NavLink key={p.id} to={`/playlist/${p.id}`} className={linkClass}>
            <ListMusic size={20} /> {p.name}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}