import type { Track } from "../types";

export type CardTheme = "cover" | "gradient" | "light";
export type CardRatio = "square" | "story";

export interface CardOptions {
  track: Track;
  lines: string[];
  theme: CardTheme;
  ratio: CardRatio;
  image: HTMLImageElement | null; 
}

const FONT = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  let p = imageCache.get(src);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    imageCache.set(src, p);
  }
  return p;
}

function hueOf(seed: string): number {
  return [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// potong teks dengan "…" kalau melebihi lebar
function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}

// bungkus teks jadi beberapa baris sesuai lebar (kata terlalu panjang dipecah per karakter)
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  let line = "";

  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxW) {
      line = test;
      continue;
    }
    if (line) out.push(line);
    if (ctx.measureText(word).width <= maxW) {
      line = word;
      continue;
    }
    let chunk = "";
    for (const ch of word) {
      if (chunk && ctx.measureText(chunk + ch).width > maxW) {
        out.push(chunk);
        chunk = ch;
      } else {
        chunk += ch;
      }
    }
    line = chunk;
  }
  if (line) out.push(line);
  return out;
}

export function drawCard(canvas: HTMLCanvasElement, o: CardOptions): void {
  const W = 1080;
  const H = o.ratio === "square" ? 1080 : 1920;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const PAD = 88;
  const light = o.theme === "light";
  const hue = hueOf(o.track.title);
  const main = light ? "#111111" : "#ffffff";
  const sub = light ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.72)";

  // --- background ---
  if (o.theme === "cover" && o.image) {
    const tiny = document.createElement("canvas");
    tiny.width = 24;
    tiny.height = 24;
    const tctx = tiny.getContext("2d");
    if (tctx) {
      const s = Math.min(o.image.width, o.image.height);
      tctx.drawImage(
        o.image,
        (o.image.width - s) / 2,
        (o.image.height - s) / 2,
        s,
        s,
        0,
        0,
        24,
        24
      );
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(tiny, 0, 0, W, H);
    }
    ctx.fillStyle = "rgba(0,0,0,.5)"; // gelapkan supaya teks terbaca
    ctx.fillRect(0, 0, W, H);
  } else if (light) {
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, `hsl(${hue}, 65%, 42%)`);
    g.addColorStop(1, `hsl(${(hue + 40) % 360}, 65%, 16%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // -- header: cover kecil + judul + artis --
  const COVER = 150;
  if (o.image) {
    const s = Math.min(o.image.width, o.image.height);
    ctx.save();
    roundedRect(ctx, PAD, PAD, COVER, COVER, 20);
    ctx.clip();
    ctx.drawImage(
      o.image,
      (o.image.width - s) / 2,
      (o.image.height - s) / 2,
      s,
      s,
      PAD,
      PAD,
      COVER,
      COVER
    );
    ctx.restore();
  } else {
    ctx.fillStyle = light ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.18)";
    roundedRect(ctx, PAD, PAD, COVER, COVER, 20);
    ctx.fill();
  }

  const tx = PAD + COVER + 32;
  const tw = W - PAD - tx;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = main;
  ctx.font = `700 42px ${FONT}`;
  ctx.fillText(fitText(ctx, o.track.title, tw), tx, PAD + 66);
  ctx.fillStyle = sub;
  ctx.font = `500 32px ${FONT}`;
  ctx.fillText(fitText(ctx, o.track.artist, tw), tx, PAD + 114);

  // -- lirik: ukuran font otomatis menyesuaikan jumlah teks --
  const top = PAD + COVER + 70;
  const bottom = H - PAD - 60;
  const areaH = bottom - top;
  const maxW = W - PAD * 2;

  let size = 76;
  let blocks: string[][] = [];
  const totalHeight = (sz: number) =>
    blocks.reduce((a, b) => a + b.length * sz * 1.22, 0) + sz * 0.55 * (blocks.length - 1);

  for (; size >= 34; size -= 2) {
    ctx.font = `800 ${size}px ${FONT}`;
    blocks = o.lines.map((l) => wrap(ctx, l, maxW));
    if (totalHeight(size) <= areaH) break;
  }
  size = Math.max(size, 34);

  ctx.font = `800 ${size}px ${FONT}`;
  ctx.fillStyle = main;
  ctx.textBaseline = "top";
  const lh = size * 1.22;
  const gap = size * 0.55;
  let y = top + Math.max(0, (areaH - totalHeight(size)) / 2);

  for (const block of blocks) {
    for (const ln of block) {
      ctx.fillText(ln, PAD, y);
      y += lh;
    }
    y += gap;
  }

  // -- footer --
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = sub;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText("🎧 Spotify Clone", PAD, H - PAD);
}