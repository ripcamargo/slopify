import type { Album, Media } from "./types";

async function call<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`);
  return data;
}

export const saveAlbum = (album: Album) => call<Album>("/api/albums", "PUT", { album });
export const deleteAlbum = (id: string) => call(`/api/albums?id=${encodeURIComponent(id)}`, "DELETE");
export const saveOrder = (ids: string[]) => call("/api/order", "PUT", { ids });
export const fetchMedia = () => call<Media>("/api/media");

export const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 10);

/** "/audio/Pasta/1. nao-me-apegar.mp3" → "Nao me apegar" */
export function titleFromFile(path: string): string {
  const name = (path.split("/").pop() ?? "")
    .normalize("NFC")
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+\s*[.\-_)]\s*/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}
