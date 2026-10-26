import type { IncomingMessage, ServerResponse } from "node:http";
import { reorderAlbums, storeError } from "../server/albums.js";
import { isAuthenticated, readJson, send } from "../server/session.js";

// Recebe { ids } na nova ordem dos álbuns.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return send(res, 405);
  }
  if (!isAuthenticated(req)) return send(res, 401, { error: "Não autenticado." });
  const { ids } = await readJson(req, 100_000);
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
    return send(res, 400, { error: "Ordem inválida." });
  }
  try {
    await reorderAlbums(ids);
    send(res, 200, { ok: true });
  } catch (err) {
    storeError(res, err);
  }
}
