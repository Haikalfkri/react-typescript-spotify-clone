import { Heart, Trash2 } from "lucide-react";
import type { Track } from "../types";
import { usePlayerStore } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { formatTime } from "../utils/format";
import AddToPlaylist from "./AddToPlaylist";

interface Props {
  track: Track;
  index: number;
  queue: Track[];
  onRemove?: () => void;
}

export default function TrackRow({ track, index, queue, onRemove }: Props) {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const isCurrent = usePlayerStore((s) => s.current?.id === track.id);
  const liked = useLibraryStore((s) => s.liked.some((t) => t.id === track.id));
  const toggleLike = useLibraryStore((s) => s.toggleLike);

  return (
    <div
      className={isCurrent ? "row current" : "row"}
      onClick={() => playTrack(track, queue)}
    >
      <span className="row-index">{index + 1}</span>

      <div className="row-info">
        <img src={track.cover} alt="" loading="lazy" />
        <div>
          <p className="row-title">{track.title}</p>
          <p className="row-sub">{track.artist}</p>
        </div>
      </div>

      <span className="row-album">{track.album}</span>

      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={liked ? "icon-btn liked" : "icon-btn"}
          onClick={() => toggleLike(track)}
          aria-label="Like"
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
        </button>
        <AddToPlaylist track={track} />
        {onRemove && (
          <button className="icon-btn" onClick={onRemove} aria-label="Hapus">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <span className="row-duration">{formatTime(track.durationMs / 1000)}</span>
    </div>
  );
}