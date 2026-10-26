import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { Media } from "../src/types";

// Os arquivos ficam em public/ e vão para o Git; o Firebase guarda só os caminhos.
// Na Vercel a pasta public/ não existe dentro das funções, então a lista vem de
// server/media.json, regravado a cada build e sempre que o app roda localmente.
const AUDIO = /\.(mp3|m4a|aac|ogg|opus|wav|flac)$/i;
const IMAGE = /\.(jpe?g|png|webp|gif|avif|svg)$/i;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

export function scanMedia(root = process.cwd()): Media {
  const pub = join(root, "public");
  const list = (folder: string, pattern: RegExp) =>
    walk(join(pub, folder))
      .filter((file) => pattern.test(file))
      .map((file) => "/" + relative(pub, file).split(sep).join("/"))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { audio: list("audio", AUDIO), covers: list("covers", IMAGE) };
}

/** Atualiza server/media.json (só regrava se mudou, para não sujar o Git à toa). */
export function writeManifest(root = process.cwd()): Media {
  const media = scanMedia(root);
  const file = join(root, "server", "media.json");
  const json = JSON.stringify(media, null, 2) + "\n";
  if (!existsSync(file) || readFileSync(file, "utf8") !== json) writeFileSync(file, json);
  return media;
}

export function listMedia(): Media {
  const root = process.cwd();
  if (existsSync(join(root, "public"))) return writeManifest(root);
  try {
    return JSON.parse(readFileSync(join(root, "server", "media.json"), "utf8"));
  } catch {
    return { audio: [], covers: [] };
  }
}
