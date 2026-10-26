import { useState } from "react";
import type { Album } from "../types";
import { saveOrder } from "../api";
import { DownIcon, UpIcon } from "../icons";

function AlbumCard({ album }: { album: Album }) {
  return (
    <a className="card" href={`#/album/${encodeURIComponent(album.id)}`}>
      <img src={album.cover || undefined} alt="" loading="lazy" />
      <strong>{album.title}</strong>
      {album.year && <span>{album.year}</span>}
    </a>
  );
}

/** Lista simples para mudar a ordem dos álbuns; cada clique já é salvo. */
function Organizer({ albums, onReorder }: { albums: Album[]; onReorder: (albums: Album[]) => void }) {
  const [error, setError] = useState("");

  async function move(index: number, delta: number) {
    const list = [...albums];
    const [item] = list.splice(index, 1);
    list.splice(index + delta, 0, item);
    onReorder(list);
    setError("");
    try {
      await saveOrder(list.map((a) => a.id));
    } catch (err) {
      onReorder(albums);
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
  onReorder: (albums: Album[]) => void;
}

export default function Library({ albums, onReorder }: Props) {
  const [organizing, setOrganizing] = useState(false);

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
          {albums.length > 1 && (
            <button className="btn" onClick={() => setOrganizing(!organizing)}>
              {organizing ? "Concluir" : "Organizar"}
            </button>
          )}
          <a className="btn btn-green" href="#/novo">+ Novo álbum</a>
        </div>
      </div>

      {organizing ? (
        <Organizer albums={albums} onReorder={onReorder} />
      ) : (
        [...groups].map(([artist, list]) => (
          <section key={artist} className="group">
            {hasArtists && <h2>{artist || "Outros"}</h2>}
            <div className="grid">
              {list.map((a) => (
                <AlbumCard key={a.id} album={a} />
              ))}
            </div>
          </section>
        ))
      )}
      {albums.length === 0 && <p className="muted">Nenhum álbum ainda. Crie o primeiro em “Novo álbum”.</p>}
    </>
  );
}
