import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import type { Track } from "../types";
import { drawCard, loadImage } from "../utils/lyricCard";
import type { CardRatio, CardTheme } from "../utils/lyricCard";

interface Props {
  track: Track;
  lines: string[];
  onClose: () => void;
}

const THEMES: { id: CardTheme; label: string }[] = [
  { id: "cover", label: "Cover blur" },
  { id: "gradient", label: "Gradient" },
  { id: "light", label: "Terang" },
];

const RATIOS: { id: CardRatio; label: string }[] = [
  { id: "square", label: "Square 1:1" },
  { id: "story", label: "Story 9:16" },
];

export default function LyricCardModal({ track, lines, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<CardTheme>("cover");
  const [ratio, setRatio] = useState<CardRatio>("square");
  const [image, setImage] = useState<HTMLImageElement | null | undefined>(undefined);

  // Muat cover
  useEffect(() => {
    let alive = true;
    loadImage(track.cover).then((img) => {
      if (alive) setImage(img);
    });
    return () => {
      alive = false;
    };
  }, [track.cover]);

  // gambar ulang setiap opsi berubah
  useEffect(() => {
    if (image === undefined || !canvasRef.current) return;
    drawCard(canvasRef.current, { track, lines, theme, ratio, image });
  }, [image, track, lines, theme, ratio]);

  // Esc untuk close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        `${track.artist} - ${track.title} (lyric card)`.replace(/[\\/:*?"<>|]/g, "") + ".png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Lyric Card</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={22} />
          </button>
        </div>

        <div className="card-preview">
          <canvas ref={canvasRef} className="card-canvas" />
        </div>

        <div className="chips">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={theme === t.id ? "chip on" : "chip"}
              onClick={() => setTheme(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="chips">
          {RATIOS.map((r) => (
            <button
              key={r.id}
              className={ratio === r.id ? "chip on" : "chip"}
              onClick={() => setRatio(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {image === null && (
          <p className="lyrics-info">
            Cover tidak bisa dimuat untuk kartu (diblokir browser), jadi dipakai background
            gradient.
          </p>
        )}

        <button className="upload-btn" onClick={download} disabled={image === undefined}>
          <Download size={18} /> Unduh PNG
        </button>
      </div>
    </div>
  );
}