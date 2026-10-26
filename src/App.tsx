import { useCallback, useEffect, useState } from "react";
import type { Album } from "./types";
import { PlayerProvider } from "./player";
import Login from "./components/Login";
import Library from "./components/Library";
import AlbumDetail from "./components/AlbumDetail";
import PlayerBar from "./components/PlayerBar";
import Optimizer from "./components/Optimizer";
import { Logo, LibraryIcon, LogoutIcon, OptimizeIcon } from "./icons";

type State =
  | { status: "loading" }
  | { status: "locked" }
  | { status: "error" }
  | { status: "ready"; albums: Album[] };

function useHash() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function Shell({ albums, onLogout }: { albums: Album[]; onLogout: () => void }) {
  const hash = useHash();
  const albumId = hash.match(/^#\/album\/(.+)$/)?.[1];
  const album = albums.find((a) => a.id === (albumId && decodeURIComponent(albumId)));
  const optimizer = hash === "#/otimizador";

  return (
    <PlayerProvider>
      <div className="layout">
        <aside className="sidebar">
          <a className="brand" href="#/">
            <Logo />
            <span>Slopfy</span>
          </a>
          <nav>
            <a className={album || optimizer ? "" : "active"} href="#/" aria-label="Biblioteca">
              <LibraryIcon /> Biblioteca
            </a>
            <a className={optimizer ? "active" : ""} href="#/otimizador" aria-label="Otimizador">
              <OptimizeIcon /> Otimizador
            </a>
            <button onClick={onLogout}>
              <LogoutIcon /> Sair
            </button>
          </nav>
        </aside>
        <main className="content">
          {optimizer ? <Optimizer /> : album ? <AlbumDetail album={album} /> : <Library albums={albums} />}
        </main>
      </div>
      <PlayerBar />
    </PlayerProvider>
  );
}

export default function App() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/catalog");
      if (res.status === 401) return setState({ status: "locked" });
      if (!res.ok) return setState({ status: "error" });
      setState({ status: "ready", albums: await res.json() });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    setState({ status: "locked" });
  }

  switch (state.status) {
    case "loading":
      return null;
    case "error":
      return (
        <main className="login">
          <div className="login-card">
            <p className="muted">Não foi possível carregar o catálogo.</p>
            <button className="btn-primary" onClick={load}>Tentar de novo</button>
          </div>
        </main>
      );
    case "locked":
      return <Login onSuccess={load} />;
    case "ready":
      return <Shell albums={state.albums} onLogout={logout} />;
  }
}
