import type { Track } from "./types";

/** Converte um link de compartilhamento do Drive em URL de download direto. */
export function driveDirectUrl(url: string): string | null {
  const id =
    url.match(/\/file\/d\/([\w-]+)/)?.[1] ??
    url.match(/[?&]id=([\w-]+)/)?.[1];
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : null;
}

/** URL usada pelo elemento de áudio: arquivo local ou Drive convertido. */
export function trackSource(track: Track): string | null {
  if (track.audioUrl) return track.audioUrl;
  return track.driveUrl ? driveDirectUrl(track.driveUrl) : null;
}

/** Alternativa para abrir a faixa numa nova aba quando a reprodução falha. */
export function trackFallback(track: Track): { href: string; label: string } | null {
  if (track.driveUrl) return { href: track.driveUrl, label: "Abrir no Drive" };
  if (track.audioUrl) return { href: track.audioUrl, label: "Abrir arquivo" };
  return null;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
