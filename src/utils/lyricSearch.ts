import type { Track } from "../types";
import type { IndexedLine } from "../store/lyricsIndexStore";

export interface LyricHit {
    track: Track;
    line: IndexedLine;
    next?: IndexedLine;
    score: number;
}

// "Don't Stop, Believin'!" -> "dont stop believin"
export function normalize(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "") // buang aksen
        .replace(/['’]/g, "") // don't -> dont
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function queryTokens(query: string): string[] {
  const q = normalize(query);
  if (q.length < 3) return [];
  return q.split(" ").filter((t) => t.length >= 2);
}

export function searchLyrics (
    query: string,
    tracks: Track[],
    entries: Record<number, IndexedLine[]>
) : LyricHit[] {
    const tokens = queryTokens(query);
    if (tokens.length === 0) return [];
    const q = normalize(query);

    const hits: LyricHit[] = [];

    for (const track of tracks) {
        const lines = entries[track.id];
        if (!lines?.length) continue;

        const norm = lines.map((l) => normalize(l.s));
        let bestIndex = -1;
        let bestScore = 0;

        for (let i = 0; i < lines.length; i++) {
            const windowText = i + 1 < lines.length ? `${norm[i]} ${norm[i + 1]}` : norm[i];
            if (!tokens.every((t) => windowText.includes(t))) continue;

            const score = norm[i].includes(q) ? 3 : windowText.includes(q) ? 2 : 1;
            if (score > bestScore) {
                bestScore = score;
                bestIndex = i;
            }
        }

        if (bestIndex >= 0) {
            hits.push({
                track,
                line: lines[bestIndex],
                next: lines[bestIndex + 1],
                score: bestScore
            });
        }
    }

    return hits.sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title));
}