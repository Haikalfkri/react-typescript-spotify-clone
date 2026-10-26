import { useNavigate, useParams } from "react-router-dom";
import { useLibraryStore } from "../store/libraryStore";
import CollectionPage from "../components/CollectionPage";

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const playlist = useLibraryStore((s) => s.playlists.find((p) => p.id === id));
  const removeFromPlaylist = useLibraryStore((s) => s.removeFromPlaylist);
  const deletePlaylist = useLibraryStore((s) => s.deletePlaylist);

  if (!playlist) {
    return (
      <div className="page">
        <p className="empty">Playlist tidak ditemukan.</p>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm(`Hapus playlist "${playlist.name}"?`)) {
      deletePlaylist(playlist.id);
      navigate("/");
    }
  };

  return (
    <CollectionPage
      title={playlist.name}
      subtitle={`${playlist.tracks.length} lagu`}
      tracks={playlist.tracks}
      onRemove={(t) => removeFromPlaylist(playlist.id, t.id)}
      actions={
        <button className="text-btn" onClick={handleDelete}>
          Hapus playlist
        </button>
      }
    />
  );
}