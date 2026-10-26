import type { IncomingMessage, ServerResponse } from "node:http";
import { listAlbums, storeError } from "../server/albums";
import { isAuthenticated, send } from "../server/session";

// O catálogo só existe no servidor: o navegador o recebe apenas após autenticar.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405);
  }
  if (!isAuthenticated(req)) return send(res, 401, { error: "Não autenticado." });
  try {
    send(res, 200, await listAlbums());
  } catch (err) {
    storeError(res, err);
  }
}
