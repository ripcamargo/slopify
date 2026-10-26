import { useCallback, useEffect, useState } from "react";
import type { Album } from "./types";
import { PlayerProvider } from "./player";
import Login from "./components/Login";
import Library from "./components/Library";
import AlbumDetail from "./components/AlbumDetail";
import AlbumEditor from "./components/AlbumEditor";
import PlayerBar from "./components/PlayerBar";
import Optimizer from "./components/Optimizer";
import { Logo, LibraryIcon, LogoutIcon, OptimizeIcon } from "./icons";

type State =
  | { status: "loading" }
  | { status: "locked" }
  | { status: "error"; message: string }
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

interface ShellProps {
  albums: Album[];
  setAlbums: (update: (albums: Album[]) => Album[]) => void;
  onLogout: () => void;
}

function Shell({ albums, setAlbums, onLogout }: ShellProps) {
  const hash = useHash();
  const route = hash.match(/^#\/album\/([^/]+)(\/editar)?$/);
  const album = albums.find((a) => a.id === (route && decodeURIComponent(route[1])));
  const editing = !!route?.[2];
  const creating = hash === "#/novo";
  const optimizer = hash === "#/otimizador";

  function saved(next: Album) {
    setAlbums((list) => (list.some((a) => a.id === next.id) ? list.map((a) => (a.id === next.id ? next : a)) : [...list, next]));
    location.hash = `#/album/${encodeURIComponent(next.id)}`;
  }

  function removed(id: string) {
    setAlbums((list) => list.filter((a) => a.id !== id));
    location.hash = "#/";
  }

  let page;
  if (optimizer) page = <Optimizer />;
  else if (creating) page = <AlbumEditor albums={albums} onSaved={saved} />;
  else if (album && editing) page = <AlbumEditor key={album.id} album={album} albums={albums} onSaved={saved} onDeleted={removed} />;
  else if (album) page = <AlbumDetail album={album} />;
  else page = <Library albums={albums} onReorder={(list) => setAlbums(() => list)} />;

  return (
    <PlayerProvider>
      <div className="layout">
        <aside className="sidebar">
          <a className="brand" href="#/">
            <Logo />
            <span>Slopfy</span>
          </a>
          <nav>
            <a className={album || optimizer || creating ? "" : "active"} href="#/" aria-label="Biblioteca">
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
        <main className="content">{page}</main>
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setState({ status: "error", message: data.error ?? "Não foi possível carregar o catálogo." });
      }
      setState({ status: "ready", albums: await res.json() });
    } catch {
      setState({ status: "error", message: "Sem conexão com o servidor." });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setAlbums = useCallback((update: (albums: Album[]) => Album[]) => {
    setState((s) => (s.status === "ready" ? { ...s, albums: update(s.albums) } : s));
  }, []);

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
            <p className="muted">{state.message}</p>
            <button className="btn-primary" onClick={load}>Tentar de novo</button>
          </div>
        </main>
      );
    case "locked":
      return <Login onSuccess={load} />;
    case "ready":
      return <Shell albums={state.albums} setAlbums={setAlbums} onLogout={logout} />;
  }
}
