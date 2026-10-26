import { useEffect, useState } from "react";
import type { Track } from "../types";
import { searchTracks } from "../services/itunes";
import TrackCard from "../components/TrackCard";

const SECTIONS = [
  { title: "Taylor Swift", term: "taylor swift" },
  { title: "Ed Sheeran", term: "ed sheeran" },
  { title: "Bruno Mars", term: "bruno mars" },
  { title: "Coldplay", term: "coldplay" },
  { title: "Imagine Dragons", term: "imagine dragons" },
  { title: "Tulus", term: "tulus" },
];

interface Section {
  title: string;
  tracks: Track[];
}

export default function Home() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      SECTIONS.map(async (s) => ({
        title: s.title,
        tracks: await searchTracks(s.term, 12),
      }))
    )
      .then((result) => {
        if (!cancelled) setSections(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="page">
      <h1 className="page-title">{greeting}</h1>

      {loading && <p className="empty">Memuat lagu…</p>}
      {error && <p className="empty">Gagal memuat data. Periksa koneksi internetmu.</p>}

      {sections.map((section) => (
        <section key={section.title} className="section">
          <h2>{section.title}</h2>
          <div className="grid">
            {section.tracks.map((t) => (
              <TrackCard key={t.id} track={t} queue={section.tracks} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}