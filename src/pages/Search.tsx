import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import type { Track } from "../types";
import { searchTracks } from "../services/itunes";
import TrackList from "../components/TrackList";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const trimmed = query.trim();
  
  useEffect(() => {
    if (!trimmed) return;

    const controller = new AbortController();

    // debounce: tunggu 400ms setelah user berhenti mengetik
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchTracks(query, 30, controller.signal));
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="page">
      <div className="search-box">
        <SearchIcon size={20} />
        <input
          autoFocus
          placeholder="Cari lagu, artis, atau album…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <p className="empty">Mencari…</p>}
      {!loading && query.trim() && results.length === 0 && (
        <p className="empty">Tidak ada hasil untuk "{query}".</p>
      )}
      {!query.trim() && <p className="empty">Ketik sesuatu untuk mulai mencari.</p>}

      <TrackList tracks={results} />
    </div>
  );
}