import { usePlayer } from "../player";
import { formatTime, trackFallback } from "../lib";
import { PauseIcon, PlayIcon } from "../icons";

export default function PlayerBar() {
  const p = usePlayer();

  if (!p.album) {
    return (
      <footer className="player player-empty">
        <p className="muted">Selecione uma faixa para ouvir</p>
      </footer>
    );
  }

  const track = p.album.tracks[p.index];
  const fallback = trackFallback(track);
  const showPause = p.playing && !p.error;
  const duration = Number.isFinite(p.duration) ? p.duration : 0;

  return (
    <footer className="player">
      <div className="player-info">
        <img src={p.album.cover || undefined} alt="" />
        <div className="player-text">
          <strong>{track.title}</strong>
          <span>{p.album.title}</span>
        </div>
      </div>

      <div className="player-center">
        <button className="play-btn" onClick={p.toggle} disabled={p.error} aria-label={showPause ? "Pausar" : "Reproduzir"}>
          {showPause ? <PauseIcon /> : <PlayIcon />}
        </button>
        {p.error ? (
          <p className="player-error">
            Não foi possível reproduzir aqui.{" "}
            {fallback && (
              <a className="drive-link" href={fallback.href} target="_blank" rel="noreferrer">{fallback.label}</a>
            )}
          </p>
        ) : (
          <div className="progress">
            <span>{formatTime(p.time)}</span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={Math.min(p.time, duration || 1)}
              disabled={!duration}
              onChange={(e) => p.seek(Number(e.target.value))}
              style={{ ["--fill" as string]: `${duration ? (p.time / duration) * 100 : 0}%` }}
              aria-label="Progresso da faixa"
            />
            <span>{duration ? formatTime(duration) : "--:--"}</span>
          </div>
        )}
      </div>
    </footer>
  );
}
