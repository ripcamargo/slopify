import type { IncomingMessage, ServerResponse } from "node:http";
import { checkPassword, readJson, send, startSession } from "../server/session";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405);
  }
  const { password } = await readJson(req);
  const result = checkPassword(password);
  if (result === "misconfigured") return send(res, 500, { error: "SLOPFY_PASSWORD não configurada." });
  if (!result) {
    await new Promise((r) => setTimeout(r, 600)); // desacelera tentativas em sequência
    return send(res, 401, { error: "Senha incorreta." });
  }
  startSession(res);
  send(res, 200, { ok: true });
}
