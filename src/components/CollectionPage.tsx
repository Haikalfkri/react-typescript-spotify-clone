import type { ReactNode } from "react";
import { Play } from "lucide-react";
import type { Track } from "../types";
import { usePlayerStore } from "../store/playerStore";
import TrackList from "./TrackList";

interface Props {
  title: string;
  subtitle: string;
  tracks: Track[];
  onRemove?: (track: Track) => void;
  actions?: ReactNode;
}

export default function CollectionPage({
  title,
  subtitle,
  tracks,
  onRemove,
  actions,
}: Props) {
  const playTrack = usePlayerStore((s) => s.playTrack);

  return (
    <div className="page">
      <div className="collection-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="collection-actions">
        <button
          className="play-big"
          disabled={tracks.length === 0}
          onClick={() => playTrack(tracks[0], tracks)}
          aria-label="Putar semua"
        >
          <Play size={26} fill="currentColor" />
        </button>
        {actions}
      </div>

      <TrackList tracks={tracks} onRemove={onRemove} />
    </div>
  );
}