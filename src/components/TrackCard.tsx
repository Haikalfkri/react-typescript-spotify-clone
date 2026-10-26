import { Play } from "lucide-react";
import type { Track } from "../types";
import { usePlayerStore } from "../store/playerStore";

interface Props {
    track: Track;
    queue: Track[];
}

export default function TrackCard({ track, queue }: Props) {
    const playTrack = usePlayerStore((s) => s.playTrack);

    return (
        <div className="card" onClick={() => playTrack(track, queue)}>
            <div className="card-cover">
                <img src={track.cover} alt={track.title} loading="lazy" />
                <button className="card-play" aria-label="Play">
                    <Play size={22} fill="currentColor" />
                </button>
            </div>
            <p className="card-title">{track.title}</p>
            <p className="card-sub">{track.artist}</p>
        </div>
    )
}