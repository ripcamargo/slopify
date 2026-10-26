import type { IncomingMessage, ServerResponse } from "node:http";
import { parseTracks, storeError, updateTracks } from "../server/albums.js";
import { isAuthenticated, readJson, send } from "../server/session.js";

// Recebe { albums: [{ id, tracks }] } e grava as faixas de todos de uma vez.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return send(res, 405);
  }
  if (!isAuthenticated(req)) return send(res, 401, { error: "Não autenticado." });
  const { albums } = await readJson(req, 1_000_000);
  const changes = Array.isArray(albums)
    ? albums.slice(0, 20).map((a) => ({ id: typeof a?.id === "string" ? a.id : "", tracks: parseTracks(a?.tracks) }))
    : [];
  if (!changes.length || changes.some((c) => !c.id || !c.tracks)) return send(res, 400, { error: "Faixas inválidas." });
  try {
    await updateTracks(changes.map((c) => ({ id: c.id, tracks: c.tracks! })));
    send(res, 200, { ok: true });
  } catch (err) {
    storeError(res, err);
  }
}
