import type { IncomingMessage, ServerResponse } from "node:http";
import { listMedia } from "../server/media.js";
import { isAuthenticated, send } from "../server/session.js";

// Lista os áudios e capas que existem em public/, para escolher no editor.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405);
  }
  if (!isAuthenticated(req)) return send(res, 401, { error: "Não autenticado." });
  send(res, 200, listMedia());
}
