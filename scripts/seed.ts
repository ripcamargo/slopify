// Importa o catálogo antigo (scripts/legacy-albums.ts) para o Firestore, uma única vez.
// Uso: npm run seed            (recusa se já houver álbuns no Firebase)
//      npm run seed -- --force (sobrescreve os álbuns com o mesmo id)
import { existsSync, readFileSync } from "node:fs";
import { albums } from "./legacy-albums.ts";
import { firestore } from "../server/firebase.ts";
import { scanMedia } from "../server/media.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

let db: ReturnType<typeof firestore>;
try {
  db = firestore();
} catch (err) {
  console.error((err as Error).message, "Veja o README (Firebase).");
  process.exit(1);
}
const collection = db.collection("albums");
const existing = await collection.limit(1).get();
if (!existing.empty && !process.argv.includes("--force")) {
  console.error("Já existem álbuns no Firebase. Use `npm run seed -- --force` para sobrescrever.");
  process.exit(1);
}

// O Linux da Vercel diferencia maiúsculas e acentos compostos; corrige o caminho para o nome real do arquivo.
const key = (path: string) => path.normalize("NFC").toLowerCase();
const files = new Map(scanMedia().audio.map((path) => [key(path), path]));

const batch = db.batch();
albums.forEach(({ id, ...album }, order) => {
  const tracks = album.tracks.map(({ lyricsUrl, ...track }: { lyricsUrl?: string; audioUrl?: string }) => {
    const result: Record<string, unknown> = { ...track };
    if (track.audioUrl) {
      const real = files.get(key(track.audioUrl));
      if (!real) console.warn(`! Áudio não encontrado: ${track.audioUrl}`);
      else if (real !== track.audioUrl) console.log(`~ ${track.audioUrl} → ${real}`);
      result.audioUrl = real ?? track.audioUrl;
    }
    if (lyricsUrl) {
      const file = `public${lyricsUrl}`;
      if (existsSync(file)) result.lyrics = readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim();
      else console.warn(`! Letra não encontrada: ${lyricsUrl}`);
    }
    return result;
  });
  const data = Object.fromEntries(Object.entries({ ...album, tracks, order }).filter(([, v]) => v !== "" && v !== undefined));
  batch.set(collection.doc(id), data);
  console.log(`+ ${album.title} (${tracks.length} faixas)`);
});
await batch.commit();
console.log("Pronto.");
