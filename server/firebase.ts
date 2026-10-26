import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export class NotConfiguredError extends Error {}

/**
 * Conta de serviço do Firebase em FIREBASE_SERVICE_ACCOUNT: o JSON baixado do console,
 * colado numa linha só ou codificado em base64.
 */
function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) throw new NotConfiguredError("FIREBASE_SERVICE_ACCOUNT não configurada.");
  const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  try {
    return JSON.parse(json);
  } catch {
    throw new NotConfiguredError("FIREBASE_SERVICE_ACCOUNT não é um JSON válido.");
  }
}

/** O navegador nunca fala com o Firebase: só as funções do servidor, depois da senha. */
export function firestore(): Firestore {
  if (!getApps().length) initializeApp({ credential: cert(serviceAccount()) });
  return getFirestore();
}
