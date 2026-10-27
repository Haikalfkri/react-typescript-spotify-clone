import { useEffect, useMemo, useRef, useState } from "react";
import { Database, Search as SearchIcon } from "lucide-react";
import { useLocalStore } from "../store/localStore";
import { useLyricsIndex } from "../store/lyricsIndexStore";
import { usePlayerStore } from "../store/playerStore";
import { fetchLyrics } from "../services/lyrics";
import { queryTokens, searchLyrics } from "../utils/lyricSearch";
import { formatTime } from "../utils/format";

// Bungkus kata yang cocok dengan <mark>
function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  const pattern = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  if (!pattern) return <>{text}</>;
  const parts = text.split(new RegExp(`(${pattern})`, "gi"));
  // hasil split dengan capture group: indeks ganjil = potongan yang cocok
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <mark key={i}>{p}</mark> : p))}
    </>
  );
}

export default function LyricSearch() {
  const tracks = useLocalStore((s) => s.tracks);
  const entries = useLyricsIndex((s) => s.entries);
  const save = useLyricsIndex((s) => s.save);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const [query, setQuery] = useState("");
  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState("");
  const stopRef = useRef(false);

  // Hentikan proses indeks kalau halaman ditutup
  useEffect(() => {
    return () => {
      stopRef.current = true;
    };
  }, []);

  const tokens = queryTokens(query);
  const hits = useMemo(() => searchLyrics(query, tracks, entries), [query, tracks, entries]);

  const pending = tracks.filter((t) => !(t.id in entries));
  const withLyrics = tracks.filter((t) => entries[t.id]?.length).length;

  const indexAll = async () => {
    stopRef.current = false;
    setIndexing(true);
    let failed = 0;

    for (let i = 0; i < pending.length; i++) {
      if (stopRef.current) break;
      const t = pending[i];
      setProgress(`Mengindeks ${i + 1}/${pending.length}: ${t.title}`);
      try {
        save(t.id, await fetchLyrics(t));
      } catch {
        failed++;
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    setIndexing(false);
    setProgress(
      failed > 0
        ? `Selesai. ${failed} lagu gagal (server lirik bermasalah), coba lagi nanti.`
        : "Selesai."
    );
  };

  const play = (i: number) => {
    const h = hits[i];
    const seekTo = h.line.t >= 0 ? Math.max(0, h.line.t - 1) : undefined;
    playTrack(h.track, hits.map((x) => x.track), seekTo);
  };

  return (
    <div className="page">
      <h1 className="page-title">Cari dari Lirik</h1>

      <div className="search-box">
        <SearchIcon size={20} />
        <input
          autoFocus
          placeholder="Ketik potongan lirik yang kamu ingat…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="lsr-bar">
        <span>
          {withLyrics}/{tracks.length} lagu punya lirik terindeks
        </span>
        {pending.length > 0 && (
          <button className="upload-btn" disabled={indexing} onClick={indexAll}>
            <Database size={16} />
            {indexing ? "Mengindeks…" : `Indeks ${pending.length} lagu`}
          </button>
        )}
        {indexing && (
          <button className="text-btn" onClick={() => (stopRef.current = true)}>
            Berhenti
          </button>
        )}
        {progress && <span>{progress}</span>}
      </div>

      {tracks.length === 0 && (
        <p className="empty">Belum ada lagu lokal. Upload dulu di halaman File Lokal.</p>
      )}
      {query.trim() && tokens.length === 0 && (
        <p className="empty">Ketik minimal 3 huruf.</p>
      )}
      {tokens.length > 0 && hits.length === 0 && (
        <p className="empty">
          Tidak ada lagu yang cocok. Pastikan lagunya sudah diindeks, atau coba kata lain.
        </p>
      )}

      {hits.map((h, i) => (
        <div key={h.track.id} className="lsr-item" onClick={() => play(i)}>
          <img src={h.track.cover} alt="" />
          <div className="lsr-info">
            <p className="row-title">{h.track.title}</p>
            <p className="row-sub">{h.track.artist}</p>
            <p className="lsr-snippet">
              <Highlight text={h.line.s} tokens={tokens} />
              {h.next && (
                <>
                  <br />
                  <span className="lsr-next">
                    <Highlight text={h.next.s} tokens={tokens} />
                  </span>
                </>
              )}
            </p>
          </div>
          {h.line.t >= 0 && <span className="lsr-time">{formatTime(h.line.t)}</span>}
        </div>
      ))}
    </div>
  );
}