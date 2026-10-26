import type { Track } from "../types";
import TrackRow from "./TrackRow";

interface Props {
    tracks: Track[],
    onRemove?: (track: Track) => void;
}

export default function TrackList({ tracks, onRemove }: Props) {
    if (tracks.length === 0) {
        return <p className="empty">Belum ada lagu di sini.</p>
    }

    return (
        <div className="track-list">
            {tracks.map((t, i) => (
                <TrackRow
                key={t.id}
                track={t}
                index={i}
                queue={tracks}
                onRemove={onRemove ? () => onRemove(t) : undefined}
                />
            ))}
        </div>
    );
}