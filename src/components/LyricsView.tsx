import { useEffect, useRef, useState } from "react";
import { ChevronDown, Play, Pause } from "lucide-react";
import type { LyricLine, Track } from "../types";
import { usePlayerStore, getAudioTime } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { useLyrics } from "../hook/useLyrics";
import { getActiveIndex } from "../utils/lrc";

// Kompensasi delay animasi scroll/transisi, supaya terasa pas di telinga
const LOOKAHEAD = 0.25;

function LyricsPanel({ track }: { track: Track }) {
  const { status, synced, plain } = useLyrics(track);

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const setLyricsOpen = usePlayerStore((s) => s.setLyricsOpen);

  const offset = useLibraryStore((s) => s.offsets[track.id] ?? 0);
  const setOffset = useLibraryStore((s) => s.setOffset);
  const seek = usePlayerStore((s) => s.seek);
  const isLocal = track.source === "local";

  const [active, setActive] = useState(-1);
  const activeRef = useRef<HTMLParagraphElement>(null);

  // Loop per frame: hitung baris aktif dari waktu audio yang real-time.
  // setActive dengan nilai sama tidak memicu render ulang.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setActive(getActiveIndex(synced, getAudioTime() + offset + LOOKAHEAD));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [synced, offset]);

  // Auto-scroll ke baris aktif
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active]);

  const changeOffset = (delta: number) =>
    setOffset(track.id, Math.round((offset + delta) * 10) / 10);

  // Klik baris = "baris ini yang sedang kudengar sekarang" -> offset dihitung otomatis
  const syncToLine = (line: LyricLine) =>
    setOffset(track.id, Math.round((line.time - getAudioTime()) * 10) / 10);

  const onLineClick = (line: LyricLine) =>
  isLocal ? seek(Math.max(0, line.time - offset)) : syncToLine(line);

  return (
    <div
      className="lyrics"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,.72), #000), url(${track.cover})`,
      }}
    >
      <header className="lyrics-header">
        <button
          className="icon-btn"
          onClick={() => setLyricsOpen(false)}
          aria-label="Tutup"
        >
          <ChevronDown size={32} />
        </button>

        <div className="lyrics-title">
          <h2>{track.title}</h2>
          <p>{track.artist}</p>
        </div>

        <div className="offset-box" title="Penyesuaian manual sinkronisasi lirik">
          <span>Sync</span>
          <button onClick={() => changeOffset(-10)}>-10s</button>
          <button onClick={() => changeOffset(-1)}>-1s</button>
          <button onClick={() => changeOffset(-0.5)}>-.5</button>
          <strong>
            {offset > 0 ? "+" : ""}
            {offset.toFixed(1)}s
          </strong>
          <button onClick={() => changeOffset(0.5)}>+.5</button>
          <button onClick={() => changeOffset(1)}>+1s</button>
          <button onClick={() => changeOffset(10)}>+10s</button>
          {/* <button onClick={() => setOffset(track.id, 0)}>reset</button> */}
        </div>
      </header>

      <div className="lyrics-body">
        {status === "loading" && <p className="lyrics-info">Memuat lirik…</p>}
        {status === "error" && (
          <p className="lyrics-info">
            {isLocal
              ? "Klik baris lirik untuk lompat ke bagian itu."
              : "Lirik tidak pas? Dengarkan audio, lalu klik baris yang sedang dinyanyikan."}
          </p>
        )}

        {status === "done" && synced.length > 0 && (
          <>
            <p className="lyrics-info">
              Lirik tidak pas? Dengarkan audio, lalu klik baris yang sedang dinyanyikan.
            </p>
            {synced.map((line, i) => (
              <p
                key={i}
                ref={i === active ? activeRef : null}
                className={
                  i === active
                    ? "lyric-line active"
                    : i < active
                    ? "lyric-line past"
                    : "lyric-line"
                }
                onClick={() => onLineClick(line)}
              >
                {line.text || "♪"}
              </p>
            ))}
          </>
        )}

        {status === "done" && synced.length === 0 && plain && (
          <>
            <p className="lyrics-info">
              Lirik ber-timestamp tidak tersedia, menampilkan teks biasa.
            </p>
            <pre className="lyrics-plain">{plain}</pre>
          </>
        )}

        {status === "done" && synced.length === 0 && !plain && (
          <p className="lyrics-info">Lirik untuk lagu ini tidak ditemukan 😢</p>
        )}
      </div>

      <button className="play-big lyrics-play" onClick={togglePlay} aria-label="Play/Pause">
        {isPlaying ? (
          <Pause size={26} fill="currentColor" />
        ) : (
          <Play size={26} fill="currentColor" />
        )}
      </button>
    </div>
  );
}

export default function LyricsView() {
  const open = usePlayerStore((s) => s.lyricsOpen);
  const current = usePlayerStore((s) => s.current);

  if (!open || !current) return null;
  return <LyricsPanel track={current} />;
}