import type { LyricLine } from "../types";

// Parse format LRC, contoh:
// [00:12.50] Baris pertama
// [00:15.00][01:30.00] Baris yang diulang
export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const stampRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  for (const raw of lrc.split("\n")) {
    const stamps = [...raw.matchAll(stampRegex)];
    if (stamps.length === 0) continue;

    const text = raw.replace(stampRegex, "").trim();

    for (const m of stamps) {
      const minutes = Number(m[1]);
      const seconds = Number(m[2]);
      const fraction = m[3] ? Number(m[3]) / Math.pow(10, m[3].length) : 0;
      lines.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}


 // Cari index baris lirik yang sedang aktif pada waktu t (binary search).
 // Mengembalikan -1 jika lagu belum sampai baris pertama.
export function getActiveIndex(lines: LyricLine[], t: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let answer = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= t) {
      answer = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return answer;
}