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
        <h1 className="logo">
          🎧 <span className="nav-label">Spotify Clone</span>
        </h1>
        <NavLink to="/" end className={linkClass} title="Home">
          <HomeIcon size={22} /> <span className="nav-label">Home</span>
        </NavLink>
        <NavLink to="/search" className={linkClass} title="Search">
          <SearchIcon size={22} /> <span className="nav-label">Search</span>
        </NavLink>
      </div>

      <div className="sidebar-box sidebar-library">
        <div className="library-header">
          <span className="nav-label">Your Library</span>
          <button onClick={handleCreate} title="Buat playlist" aria-label="Buat playlist">
            <Plus size={20} />
          </button>
        </div>

        <NavLink to="/liked" className={linkClass} title="Liked Songs">
          <Heart size={20} /> <span className="nav-label">Liked Songs</span>
        </NavLink>
        <NavLink to="/history" className={linkClass} title="History">
          <HistoryIcon size={20} /> <span className="nav-label">History</span>
        </NavLink>
        <NavLink to="/lyric-search" className={linkClass} title="Cari Lirik">
          <Quote size={20} /> <span className="nav-label">Search Lyrics</span>
        </NavLink>
        <NavLink to="/local" className={linkClass} title="File Lokal">
          <FolderOpen size={20} /> <span className="nav-label">Local Files</span>
        </NavLink>

        {playlists.map((p) => (
          <NavLink key={p.id} to={`/playlist/${p.id}`} className={linkClass} title={p.name}>
            <ListMusic size={20} /> <span className="nav-label">{p.name}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
}