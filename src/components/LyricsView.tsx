import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Play, Pause, Image as ImageIcon } from "lucide-react";
import type { LyricLine, Track } from "../types";
import { usePlayerStore, getAudioTime } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { useLyrics } from "../hooks/useLyrics";
import { getActiveIndex } from "../utils/lrc";
import LyricCardModal from "./LyricCardModal";

// delay animasi scroll/transisi
const LOOKAHEAD = 0.25;
const MAX_PICK = 5;

function LyricsPanel({ track }: { track: Track }) {
  const { status, synced, plain } = useLyrics(track);

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const setLyricsOpen = usePlayerStore((s) => s.setLyricsOpen);
  const seek = usePlayerStore((s) => s.seek);

  const offset = useLibraryStore((s) => s.offsets[track.id] ?? 0);
  const setOffset = useLibraryStore((s) => s.setOffset);

  const isLocal = track.source === "local";

  const [active, setActive] = useState(-1);
  const activeRef = useRef<HTMLParagraphElement>(null);

  // state mode card
  const [cardMode, setCardMode] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [cardLines, setCardLines] = useState<string[] | null>(null);

  // baris aktif dihitung dari waktu audio real-time
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setActive(getActiveIndex(synced, getAudioTime() + offset + LOOKAHEAD));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [synced, offset]);

  // auto scroll ke baris aktif
  useEffect(() => {
    if (cardMode) return;
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active, cardMode]);

  const changeOffset = (delta: number) =>
    setOffset(track.id, Math.round((offset + delta) * 10) / 10);

  const syncToLine = (line: LyricLine) =>
    setOffset(track.id, Math.round((line.time - getAudioTime()) * 10) / 10);

  const onLineClick = (line: LyricLine) =>
    isLocal ? seek(Math.max(0, line.time - offset)) : syncToLine(line);

  const toggleCardMode = () => {
    setCardMode((m) => !m);
    setPicked([]);
  };

  const togglePick = (i: number) =>
    setPicked((p) =>
      p.includes(i) ? p.filter((x) => x !== i) : p.length >= MAX_PICK ? p : [...p, i]
    );

  const openCard = () => {
    const texts = [...picked]
      .sort((a, b) => a - b) // urutkan sesuai urutan lagu, bukan urutan klik
      .map((i) => synced[i]?.text)
      .filter((t): t is string => !!t);
    if (texts.length > 0) setCardLines(texts);
  };

  return (
    <div
      className="lyrics"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,.72), #000), url("${track.cover}")`,
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

        <button
          className={cardMode ? "chip on" : "chip"}
          onClick={toggleCardMode}
          disabled={synced.length === 0}
          title="Pilih baris lirik untuk dijadikan kartu gambar"
        >
          <ImageIcon size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
          Kartu
        </button>

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
          <button onClick={() => setOffset(track.id, 0)}>reset</button>
        </div>
      </header>

      <div className="lyrics-body">
        {status === "loading" && <p className="lyrics-info">Memuat lirik…</p>}
        {status === "error" && (
          <p className="lyrics-info">
            Server lirik sedang bermasalah. Tutup dan buka lagi sebentar lagi.
          </p>
        )}

        {status === "done" && synced.length > 0 && (
          <>
            <p className="lyrics-info">
              {cardMode
                ? `Klik sampai ${MAX_PICK} baris untuk dijadikan kartu.`
                : isLocal
                ? "Klik baris lirik untuk lompat ke bagian itu."
                : "Lirik tidak pas? Dengarkan audio, lalu klik baris yang sedang dinyanyikan."}
            </p>
            {synced.map((line, i) => {
              const cls = [
                "lyric-line",
                i === active ? "active" : i < active ? "past" : "",
                picked.includes(i) ? "picked" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <p
                  key={i}
                  ref={i === active ? activeRef : null}
                  className={cls}
                  onClick={() => (cardMode ? togglePick(i) : onLineClick(line))}
                >
                  {line.text || "♪"}
                </p>
              );
            })}
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

      {cardMode && (
        <div className="card-bar">
          <span>
            {picked.length}/{MAX_PICK} baris dipilih
          </span>
          <button className="card-make" disabled={picked.length === 0} onClick={openCard}>
            Buat kartu
          </button>
        </div>
      )}

      <button className="play-big lyrics-play" onClick={togglePlay} aria-label="Play/Pause">
        {isPlaying ? (
          <Pause size={26} fill="currentColor" />
        ) : (
          <Play size={26} fill="currentColor" />
        )}
      </button>

      {/* portal ke body supaya modal tidak tertutup bar player */}
      {cardLines &&
        createPortal(
          <LyricCardModal
            track={track}
            lines={cardLines}
            onClose={() => setCardLines(null)}
          />,
          document.body
        )}
    </div>
  );
}

export default function LyricsView() {
  const open = usePlayerStore((s) => s.lyricsOpen);
  const current = usePlayerStore((s) => s.current);

  if (!open || !current) return null;
  return <LyricsPanel track={current} />;
}