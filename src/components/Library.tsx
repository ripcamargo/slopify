import type { Album } from "../types";

function AlbumCard({ album }: { album: Album }) {
  return (
    <a className="card" href={`#/album/${encodeURIComponent(album.id)}`}>
      <img src={album.cover} alt="" loading="lazy" />
      <strong>{album.title}</strong>
      {album.year && <span>{album.year}</span>}
    </a>
  );
}

export default function Library({ albums }: { albums: Album[] }) {
  // Agrupa por artista, na ordem em que aparecem em albums.ts.
  const groups = new Map<string, Album[]>();
  for (const album of albums) {
    const key = album.artist ?? "";
    groups.set(key, [...(groups.get(key) ?? []), album]);
  }
  const hasArtists = [...groups.keys()].some(Boolean);

  return (
    <>
      <h1>Sua biblioteca</h1>
      {[...groups].map(([artist, list]) => (
        <section key={artist} className="group">
          {hasArtists && <h2>{artist || "Outros"}</h2>}
          <div className="grid">
            {list.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </div>
        </section>
      ))}
      {albums.length === 0 && <p className="muted">Nenhum álbum em src/data/albums.ts.</p>}
    </>
  );
}
