import { useState, type FormEvent } from "react";
import { Logo } from "../icons";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) return onSuccess();
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível entrar.");
    } catch {
      setError("Sem conexão com o servidor.");
    }
    setBusy(false);
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="brand brand-lg">
          <Logo />
          <span>Slopify</span>
        </div>
        <input
          type="password"
          placeholder="Senha"
          aria-label="Senha"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn-primary" disabled={busy || !password}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
