import type { IncomingMessage, ServerResponse } from "node:http";
import { endSession, send } from "../server/session";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405);
  }
  endSession(res);
  send(res, 200, { ok: true });
}
