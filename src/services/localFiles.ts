import { parseBlob, selectCover } from "music-metadata";
import type { Track } from "../types";
import { saveAudio } from "./localDb";

export const LOCAL_ALBUM = "File Lokal";

// file yang sama selalu dapat ID yang sama (tidak duplikat)
function makeId(file: File): number {
  const str = `${file.name}|${file.size}|${file.lastModified}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return -(Math.abs(h) + 1);
}

// "Artis - Judul.mp3" -> { artist, title }
function fromFilename(name: string): { artist: string; title: string } {
  const base = name.replace(/\.[^.]+$/, "").replace(/_/g, " ").trim();
  const parts = base.split(/\s+-\s+/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: "Unknown Artist", title: base };
}

// fallback durasi lewat <audio>
function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    const url = URL.createObjectURL(file);
    const done = (d: number) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? d : 0);
    };
    a.preload = "metadata";
    a.onloadedmetadata = () => done(a.duration);
    a.onerror = () => done(0);
    a.src = url;
  });
}

async function coverToDataUrl(blob: Blob): Promise<string> {
  const bmp = await createImageBitmap(blob);
  const size = 300;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");

  const s = Math.min(bmp.width, bmp.height);
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  bmp.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

function placeholderCover(seed: string): string {
  const hue = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const first = seed.trim()[0] ?? "";
  const letter = /[\p{L}\p{N}]/u.test(first) ? first.toUpperCase() : "♪";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">` +
    `<rect width="300" height="300" fill="hsl(${hue},45%,35%)"/>` +
    `<text x="150" y="190" font-size="120" font-family="sans-serif" font-weight="700" ` +
    `text-anchor="middle" fill="white">${letter}</text></svg>`;
  const encoded = encodeURIComponent(svg).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || /\.(mp3|m4a|aac|flac|wav|ogg|opus)$/i.test(file.name);
}

export async function importLocalFile(file: File): Promise<Track> {
  const id = makeId(file);
  const fallback = fromFilename(file.name);

  let title = fallback.title;
  let artist = fallback.artist;
  let album = LOCAL_ALBUM;
  let genre = "Lokal";
  let duration = 0;
  let cover = "";

  try {
    const meta = await parseBlob(file);
    title = meta.common.title?.trim() || title;
    artist = meta.common.artist?.trim() || meta.common.albumartist?.trim() || artist;
    album = meta.common.album?.trim() || album;
    genre = meta.common.genre?.[0] ?? genre;
    duration = meta.format.duration ?? 0;

    const pic = selectCover(meta.common.picture);
    if (pic) {
      cover = await coverToDataUrl(new Blob([new Uint8Array(pic.data)], { type: pic.format }));
    }
  } catch (e) {
    console.warn("Gagal membaca tag:", file.name, e);
  }

  if (!duration) duration = await readDuration(file);

  // simpan file audio aslinya
  await saveAudio(id, file);

  return {
    id,
    title,
    artist,
    album,
    cover: cover || placeholderCover(title),
    previewUrl: "", // lagu lokal diambil dari IndexedDB saat diputar
    durationMs: Math.round(duration * 1000),
    genre,
    source: "local",
  };
}