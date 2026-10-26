import type { ServerResponse } from "node:http";
import type { Album, Track } from "../src/types";
import { firestore, NotConfiguredError } from "./firebase.js";
import { send } from "./session.js";

// Cada álbum é um documento em "albums" (id = album.id) com um campo "order" para a posição.
const albums = () => firestore().collection("albums");

export async function listAlbums(): Promise<Album[]> {
  const snap = await albums().orderBy("order").get();
  return snap.docs.map((doc) => {
    const { order: _order, ...data } = doc.data();
    return { ...data, id: doc.id } as Album;
  });
}

/** Grava o álbum inteiro; um álbum novo entra no fim da lista. */
export async function saveAlbum(album: Album) {
  const ref = albums().doc(album.id);
  await firestore().runTransaction(async (tx) => {
    const current = await tx.get(ref);
    let order = current.get("order");
    if (typeof order !== "number") {
      const last = await tx.get(albums().orderBy("order", "desc").limit(1));
      order = (last.docs[0]?.get("order") ?? -1) + 1;
    }
    const { id: _id, ...data } = album;
    tx.set(ref, { ...data, order });
  });
}

export async function deleteAlbum(id: string) {
  await albums().doc(id).delete();
}

export async function reorderAlbums(ids: string[]) {
  const existing = new Set((await albums().select().get()).docs.map((d) => d.id));
  const batch = firestore().batch();
  ids.filter((id) => existing.has(id)).forEach((id, order) => batch.update(albums().doc(id), { order }));
  await batch.commit();
}

const ID = /^[\w-]{1,64}$/;
// Um documento do Firestore tem no máximo 1 MiB; a capa enviada pelo app vem como data URL.
const MAX_COVER = 700_000;
const MAX_LYRICS = 20_000;

function text(value: unknown, max = 300): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Monta o objeto só com os campos preenchidos (o Firestore não aceita undefined). */
function compact<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined)) as T;
}

function parseTrack(input: unknown, index: number): Track | null {
  if (!input || typeof input !== "object") return null;
  const t = input as Record<string, unknown>;
  const id = text(t.id, 64);
  if (!ID.test(id)) return null;
  return compact({
    id,
    title: text(t.title) || `Faixa ${index + 1}`,
    audioUrl: text(t.audioUrl, 500),
    driveUrl: text(t.driveUrl, 500),
    lyrics: typeof t.lyrics === "string" ? t.lyrics.replace(/\r\n/g, "\n").trim().slice(0, MAX_LYRICS) : "",
  });
}

export function parseAlbum(input: unknown): Album | null {
  if (!input || typeof input !== "object") return null;
  const a = input as Record<string, unknown>;
  const id = text(a.id, 64);
  const title = text(a.title);
  const cover = text(a.cover, MAX_COVER + 1);
  if (!ID.test(id) || !title || cover.length > MAX_COVER) return null;
  const year = Number(a.year);
  const tracks = Array.isArray(a.tracks) ? a.tracks.slice(0, 300).map(parseTrack) : [];
  if (tracks.includes(null)) return null;
  return {
    ...compact({
      id,
      title,
      artist: text(a.artist),
      description: text(a.description, 2000),
      year: Number.isInteger(year) && year > 1900 && year < 2200 ? year : undefined,
    }),
    cover,
    tracks: tracks as Track[],
  };
}

/** Resposta de erro do Firestore com uma mensagem que ajuda a resolver. */
export function storeError(res: ServerResponse, err: unknown) {
  if (err instanceof NotConfiguredError) return send(res, 500, { error: err.message });
  console.error(err);
  const code = (err as { code?: unknown })?.code;
  if (code === 5) return send(res, 500, { error: "Banco Firestore não encontrado: crie-o no console do Firebase." });
  if (code === 7) return send(res, 500, { error: "Sem permissão no Firestore: confira a conta de serviço." });
  send(res, 500, { error: "Erro ao acessar o Firebase." });
}
