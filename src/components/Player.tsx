import type { CSSProperties } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Mic,
} from "lucide-react";
import { usePlayerStore } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { formatTime } from "../utils/format";

export default function Player() {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    lyricsOpen,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    setLyricsOpen,
  } = usePlayerStore();

  const liked = useLibraryStore((s) =>
    current ? s.liked.some((t) => t.id === current.id) : false
  );
  const toggleLike = useLibraryStore((s) => s.toggleLike);

  if (!current) {
    return (
      <footer className="player player-empty">
        Pilih lagu untuk mulai mendengarkan 🎵
      </footer>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="player">
      {/* kiri: info lagu (klik untuk buka lirik) */}
      <div className="player-left">
        <div
          className="player-track"
          onClick={() => setLyricsOpen(true)}
          title="Klik untuk lihat lirik"
        >
          <img src={current.cover} alt={current.title} />
          <div>
            <p className="row-title">{current.title}</p>
            <p className="row-sub">{current.artist}</p>
          </div>
        </div>
        <button
          className={liked ? "icon-btn liked" : "icon-btn"}
          onClick={() => toggleLike(current)}
          aria-label="Like"
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* tengah: kontrol + progress bar */}
      <div className="player-center">
        <div className="controls">
          <button
            className={shuffle ? "icon-btn on" : "icon-btn"}
            onClick={toggleShuffle}
            aria-label="Shuffle"
          >
            <Shuffle size={18} />
          </button>
          <button className="icon-btn" onClick={prev} aria-label="Sebelumnya">
            <SkipBack size={22} fill="currentColor" />
          </button>
          <button className="play-btn" onClick={togglePlay} aria-label="Play/Pause">
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </button>
          <button className="icon-btn" onClick={() => next()} aria-label="Berikutnya">
            <SkipForward size={22} fill="currentColor" />
          </button>
          <button
            className={repeat !== "off" ? "icon-btn on" : "icon-btn"}
            onClick={cycleRepeat}
            aria-label="Repeat"
          >
            {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        <div className="progress">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            style={{ "--progress": `${progress}%` } as CSSProperties}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* kanan: tombol lirik + volume */}
      <div className="player-right">
        <button
          className={lyricsOpen ? "icon-btn on" : "icon-btn"}
          onClick={() => setLyricsOpen(!lyricsOpen)}
          title="Lirik"
          aria-label="Lirik"
        >
          <Mic size={20} />
        </button>
        <button
          className="icon-btn"
          onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
          aria-label="Mute"
        >
          {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <input
          type="range"
          className="volume"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ "--progress": `${volume * 100}%` } as CSSProperties}
        />
      </div>
    </footer>
  );
}