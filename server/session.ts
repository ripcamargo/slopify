import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const COOKIE = "slopfy_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias
const isProd = process.env.NODE_ENV === "production";

/** Em produção a variável é obrigatória; o padrão só vale em desenvolvimento. */
function getPassword(): string | null {
  const fromEnv = process.env.SLOPFY_PASSWORD;
  if (fromEnv) return fromEnv;
  return isProd ? null : "charliebrow";
}

const sha = (s: string) => createHash("sha256").update(s).digest();

function sign(value: string, password: string) {
  const key = sha(`slopfy-session:${password}`);
  return createHmac("sha256", key).update(value).digest("hex");
}

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function checkPassword(input: unknown): boolean | "misconfigured" {
  const password = getPassword();
  if (!password) return "misconfigured";
  if (typeof input !== "string") return false;
  return safeEqual(sha(input), sha(password));
}

function cookieFlags(maxAge: number) {
  return `Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${isProd ? "; Secure" : ""}`;
}

export function startSession(res: ServerResponse) {
  const password = getPassword();
  if (!password) return;
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  const token = `${expires}.${sign(expires, password)}`;
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; ${cookieFlags(MAX_AGE)}`);
}

export function endSession(res: ServerResponse) {
  res.setHeader("Set-Cookie", `${COOKIE}=; ${cookieFlags(0)}`);
}

export function isAuthenticated(req: IncomingMessage): boolean {
  const password = getPassword();
  if (!password) return false;
  const raw = req.headers.cookie?.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return false;
  const [expires, signature] = raw.slice(COOKIE.length + 1).split(".");
  if (!expires || !signature) return false;
  if (Number(expires) < Date.now() / 1000) return false;
  return safeEqual(Buffer.from(signature), Buffer.from(sign(expires, password)));
}

export function send(res: ServerResponse, status: number, body?: unknown) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store");
  if (body === undefined) return res.end();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

/** Lê o corpo JSON (a Vercel já entrega req.body; em dev lemos o stream). */
export async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const preParsed = (req as { body?: unknown }).body;
  if (preParsed !== undefined) {
    if (typeof preParsed === "string") return safeParse(preParsed);
    return (preParsed ?? {}) as Record<string, unknown>;
  }
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 2048) return {};
  }
  return safeParse(data);
}

function safeParse(text: string): Record<string, unknown> {
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}
