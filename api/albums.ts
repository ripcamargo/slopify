import type { IncomingMessage, ServerResponse } from "node:http";
import { deleteAlbum, parseAlbum, saveAlbum, storeError } from "../server/albums";
import { isAuthenticated, readJson, send } from "../server/session";

// PUT cria ou substitui um álbum inteiro (com as faixas); DELETE ?id= remove.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "PUT" && req.method !== "DELETE") {
    res.setHeader("Allow", "PUT, DELETE");
    return send(res, 405);
  }
  if (!isAuthenticated(req)) return send(res, 401, { error: "Não autenticado." });
  try {
    if (req.method === "DELETE") {
      const id = new URL(req.url ?? "", "http://localhost").searchParams.get("id");
      if (!id) return send(res, 400, { error: "Informe o álbum." });
      await deleteAlbum(id);
      return send(res, 200, { ok: true });
    }
    const album = parseAlbum((await readJson(req, 3_000_000)).album);
    if (!album) return send(res, 400, { error: "Álbum inválido (título obrigatório; capa enviada até ~500 KB)." });
    await saveAlbum(album);
    send(res, 200, album);
  } catch (err) {
    storeError(res, err);
  }
}
