import { useState, type DragEvent } from "react";
import type { Album } from "../types";
import { newId, saveOrder, saveTracks } from "../api";
import { dropIndex, moveItem, startDrag } from "../dnd";
import { usePlayer } from "../player";
import { CloseIcon, DownIcon, GripIcon, PauseIcon, PlayIcon, UpIcon } from "../icons";

const EXPANDED_KEY = "slopify:expanded";

function loadExpanded(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(EXPANDED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

/** Faixa sendo arrastada e onde ela cairia. */
type Drag = { albumId: string; trackId: string };
type Target = { albumId: string; index: number };

interface DndProps {
  drag: Drag | null;
  target: Target | null;
  onDragStart: (drag: Drag) => void;
  onOver: (target: Target) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

interface CardProps extends DndProps {
  album: Album;
  expanded: boolean;
  onToggle: () => void;
}

function AlbumCard({ album, expanded, onToggle, drag, target, onOver, onDrop }: CardProps) {
  const count = album.tracks.length;
  // Soltar uma faixa sobre a capa coloca-a no fim deste álbum.
  const over = (e: DragEvent) => {
    if (!drag) return;
    e.preventDefault();
    onOver({ albumId: album.id, index: count });
  };
  const isTarget = !!drag && target?.albumId === album.id && drag.albumId !== album.id;

  return (
    <div
      className={["card", expanded && "card-open", isTarget && "drop-target"].filter(Boolean).join(" ")}
      onDragOver={over}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <a className="card-link" href={`#/album/${encodeURIComponent(album.id)}`}>
        <img src={album.cover || undefined} alt="" loading="lazy" />
        <strong>{album.title}</strong>
        {album.year && <span>{album.year}</span>}
      </a>
      <button className="card-toggle" onClick={onToggle} aria-expanded={expanded}>
        {count} {count === 1 ? "faixa" : "faixas"}
        <DownIcon />
      </button>
    </div>
  );
}

function AlbumPanel({ album, onClose, drag, target, onDragStart, onOver, onDrop, onDragEnd }: DndProps & { album: Album; onClose: () => void }) {
  const player = usePlayer();
  const here = drag && target?.albumId === album.id ? target.index : -1;
  const last = album.tracks.length - 1;

  return (
    <section
      className="album-panel"
      aria-label={`Faixas de ${album.title}`}
      onDragOver={(e) => {
        if (!drag) return;
        e.preventDefault();
        onOver({ albumId: album.id, index: album.tracks.length });
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <header>
        <a href={`#/album/${encodeURIComponent(album.id)}`}>{album.title}</a>
        <button className="icon-btn" onClick={onClose} aria-label="Recolher">
          <CloseIcon />
        </button>
      </header>
      {album.tracks.length === 0 && <p className="muted panel-empty">Sem faixas. Arraste uma para cá.</p>}
      <ol className="panel-tracks">
        {album.tracks.map((track, i) => {
          const active = player.album?.id === album.id && player.index === i;
          const isPlaying = active && player.playing && !player.error;
          const dragging = drag?.trackId === track.id && drag.albumId === album.id;
          const cls = [
            "panel-track",
            active && "active",
            dragging && "dragging",
            here === i && "drop-before",
            here === i + 1 && i === last && "drop-after",
          ];
          return (
            <li
              key={track.id}
              className={cls.filter(Boolean).join(" ")}
              draggable
              onDragStart={(e) => {
                startDrag(e);
                onDragStart({ albumId: album.id, trackId: track.id });
              }}
              onDragEnd={onDragEnd}
              onDragOver={(e) => {
                if (!drag) return;
                e.preventDefault();
                e.stopPropagation();
                onOver({ albumId: album.id, index: dropIndex(e, i) });
              }}
            >
              <span className="grip" aria-hidden="true"><GripIcon /></span>
              <button className="panel-play" onClick={() => player.play(album, i)} aria-label={`${isPlaying ? "Pausar" : "Reproduzir"} ${track.title}`}>
                <span className="track-num">{i + 1}</span>
                <span className="track-icon">{isPlaying ? <PauseIcon /> : <PlayIcon />}</span>
                <span className="track-title">{track.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Lista simples para mudar a ordem dos álbuns; cada clique já é salvo. */
function Organizer({ albums, onChange }: { albums: Album[]; onChange: (albums: Album[]) => void }) {
  const [error, setError] = useState("");

  async function move(index: number, delta: number) {
    const list = [...albums];
    const [item] = list.splice(index, 1);
    list.splice(index + delta, 0, item);
    onChange(list);
    setError("");
    try {
      await saveOrder(list.map((a) => a.id));
    } catch (err) {
      onChange(albums);
      setError((err as Error).message);
    }
  }

  return (
    <>
      {error && <p className="form-error" role="alert">{error}</p>}
      <ol className="order-list">
        {albums.map((a, i) => (
          <li key={a.id}>
            <img src={a.cover || undefined} alt="" />
            <div className="order-text">
              <strong>{a.title}</strong>
              {a.artist && <span className="muted">{a.artist}</span>}
            </div>
            <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Subir ${a.title}`}>
              <UpIcon />
            </button>
            <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === albums.length - 1} aria-label={`Descer ${a.title}`}>
              <DownIcon />
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

interface Props {
  albums: Album[];
  onChange: (albums: Album[]) => void;
}

export default function Library({ albums, onChange }: Props) {
  const [organizing, setOrganizing] = useState(false);
  const [expanded, setExpanded] = useState(loadExpanded);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [error, setError] = useState("");

  function setOpen(ids: string[]) {
    const next = new Set(ids);
    setExpanded(next);
    try {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify(ids));
    } catch {
      // Sem armazenamento local: só não lembra entre visitas.
    }
  }
  const toggle = (id: string) => setOpen(expanded.has(id) ? [...expanded].filter((x) => x !== id) : [...expanded, id]);
  const allOpen = albums.length > 0 && albums.every((a) => expanded.has(a.id));

  function endDrag() {
    setDrag(null);
    setTarget(null);
  }

  async function drop() {
    const d = drag;
    const t = target;
    endDrag();
    if (!d || !t) return;
    const source = albums.find((a) => a.id === d.albumId);
    const dest = albums.find((a) => a.id === t.albumId);
    const from = source?.tracks.findIndex((tr) => tr.id === d.trackId) ?? -1;
    if (!source || !dest || from < 0) return;

    let changed: Album[];
    if (source.id === dest.id) {
      if (t.index === from || t.index === from + 1) return;
      changed = [{ ...source, tracks: moveItem(source.tracks, from, t.index) }];
    } else {
      // Ids de faixa só são únicos dentro do álbum; ao mudar de álbum, evita repetir.
      const track = source.tracks[from];
      const moved = dest.tracks.some((tr) => tr.id === track.id) ? { ...track, id: newId() } : track;
      const destTracks = [...dest.tracks];
      destTracks.splice(t.index, 0, moved);
      changed = [
        { ...source, tracks: source.tracks.filter((_, i) => i !== from) },
        { ...dest, tracks: destTracks },
      ];
    }

    const previous = albums;
    onChange(albums.map((a) => changed.find((c) => c.id === a.id) ?? a));
    setError("");
    try {
      await saveTracks(changed);
    } catch (err) {
      onChange(previous);
      setError(`Não salvei a mudança: ${(err as Error).message}`);
    }
  }

  // dragover dispara sem parar; só re-renderiza quando o ponto de inserção muda.
  const over = (t: Target) => setTarget((prev) => (prev?.albumId === t.albumId && prev.index === t.index ? prev : t));
  const dnd: DndProps = { drag, target, onDragStart: setDrag, onOver: over, onDrop: drop, onDragEnd: endDrag };

  // Agrupa por artista, na ordem dos álbuns.
  const groups = new Map<string, Album[]>();
  for (const album of albums) {
    const key = album.artist ?? "";
    groups.set(key, [...(groups.get(key) ?? []), album]);
  }
  const hasArtists = [...groups.keys()].some(Boolean);

  return (
    <>
      <div className="page-head">
        <h1>Sua biblioteca</h1>
        <div className="actions">
          {!organizing && albums.length > 0 && (
            <button className="btn" onClick={() => setOpen(allOpen ? [] : albums.map((a) => a.id))}>
              {allOpen ? "Recolher tudo" : "Mostrar faixas"}
            </button>
          )}
          {albums.length > 1 && (
            <button className="btn" onClick={() => setOrganizing(!organizing)}>
              {organizing ? "Concluir" : "Organizar"}
            </button>
          )}
          <a className="btn btn-green" href="#/novo">+ Novo álbum</a>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}

      {organizing ? (
        <Organizer albums={albums} onChange={onChange} />
      ) : (
        [...groups].map(([artist, list]) => (
          <section key={artist} className="group">
            {hasArtists && <h2>{artist || "Outros"}</h2>}
            <div className="grid">
              {list.flatMap((a) => {
                const open = expanded.has(a.id);
                const card = <AlbumCard key={a.id} album={a} expanded={open} onToggle={() => toggle(a.id)} {...dnd} />;
                return open ? [card, <AlbumPanel key={`${a.id}-panel`} album={a} onClose={() => toggle(a.id)} {...dnd} />] : [card];
              })}
            </div>
          </section>
        ))
      )}
      {albums.length === 0 && <p className="muted">Nenhum álbum ainda. Crie o primeiro em “Novo álbum”.</p>}
      {!organizing && expanded.size > 0 && (
        <p className="muted hint">Arraste as faixas para mudar a ordem ou para outro álbum (inclusive sobre a capa).</p>
      )}
    </>
  );
}
