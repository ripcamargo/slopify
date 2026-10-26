import { useEffect, useState } from "react";
import type { Album } from "../types";
import { usePlayer } from "../player";
import { PauseIcon, PlayIcon } from "../icons";
import { trackFallback } from "../lib";

function Lyrics({ url }: { url: string }) {
  const [text, setText] = useState<string | null | undefined>(undefined); // undefined = carregando, null = falhou

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(async (res) => {
        // Em dev, arquivo inexistente devolve o index.html; trate como erro.
        const isHtml = res.headers.get("content-type")?.includes("text/html");
        if (!res.ok || isHtml) throw new Error();
        return res.text();
      })
      .then((t) => !cancelled && setText(t.trim()))
      .catch(() => !cancelled && setText(null));
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (text === undefined) return <p className="lyrics muted">Carregando…</p>;
  if (text === null) return <p className="lyrics muted">Não encontrei o arquivo da letra.</p>;
  return <pre className="lyrics">{text}</pre>;
}

export default function AlbumDetail({ album }: { album: Album }) {
  const player = usePlayer();
  const [lyricsOpen, setLyricsOpen] = useState<string | null>(null);

  return (
    <>
      <a className="back" href="#/">← Biblioteca</a>
      <header className="album-head">
        <img src={album.cover} alt="" />
        <div>
          <h1>{album.title}</h1>
          <p className="muted">
            {[
              album.artist,
              album.year,
              `${album.tracks.length} ${album.tracks.length === 1 ? "faixa" : "faixas"}`,
              album.description,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </header>

      <ol className="tracks">
        {album.tracks.map((track, i) => {
          const active = player.album?.id === album.id && player.index === i;
          const isPlaying = active && player.playing && !player.error;
          const fallback = trackFallback(track);
          const showLyrics = lyricsOpen === track.id && track.lyricsUrl;
          return (
            <li key={track.id} className={active ? "track active" : "track"}>
              <div className="track-row">
                <button
                  className="track-btn"
                  onClick={() => player.play(album, i)}
                  aria-label={`${isPlaying ? "Pausar" : "Reproduzir"} ${track.title}`}
                >
                  <span className="track-num">{i + 1}</span>
                  <span className="track-icon">{isPlaying ? <PauseIcon /> : <PlayIcon />}</span>
                  <span className="track-title">{track.title}</span>
                </button>
                {active && player.error && fallback && (
                  <a className="drive-link" href={fallback.href} target="_blank" rel="noreferrer">
                    {fallback.label}
                  </a>
                )}
                {track.lyricsUrl && (
                  <button
                    className="lyrics-btn"
                    aria-expanded={!!showLyrics}
                    onClick={() => setLyricsOpen(showLyrics ? null : track.id)}
                  >
                    Letra
                  </button>
                )}
              </div>
              {showLyrics && <Lyrics url={track.lyricsUrl!} />}
            </li>
          );
        })}
      </ol>
    </>
  );
}
