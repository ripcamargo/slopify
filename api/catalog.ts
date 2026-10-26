import type { IncomingMessage, ServerResponse } from "node:http";
import { albums } from "../src/data/albums";
import { isAuthenticated, send } from "../server/session";

// O catálogo só existe no servidor: o navegador o recebe apenas após autenticar.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405);
  }
  if (!isAuthenticated(req)) return send(res, 401, { error: "Não autenticado." });
  send(res, 200, albums);
}
