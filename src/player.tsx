import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Album } from "./types";
import { trackSource } from "./lib";

interface PlayerState {
  album: Album | null;
  index: number;
  playing: boolean;
  time: number;
  duration: number;
  /** A reprodução direta falhou (bloqueio do Drive, link inválido, formato...). */
  error: boolean;
  play: (album: Album, index: number) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer fora do PlayerProvider");
  return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<{ album: Album; index: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  const load = useCallback((album: Album, index: number) => {
    const audio = audioRef.current!;
    setCurrent({ album, index });
    setTime(0);
    setDuration(0);
    setPlaying(false);
    audio.pause();
    const src = trackSource(album.tracks[index]);
    if (!src) {
      audio.removeAttribute("src");
      setError(true);
      return;
    }
    setError(false);
    audio.src = src;
    audio.play().catch((e) => {
      if (e?.name !== "AbortError") setError(true);
    });
  }, []);

  const play = useCallback(
    (album: Album, index: number) => {
      const audio = audioRef.current!;
      if (current?.album.id === album.id && current.index === index && !error) {
        if (audio.paused) audio.play().catch(() => setError(true));
        else audio.pause();
        return;
      }
      load(album, index);
    },
    [current, error, load],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current!;
    if (!current || error) return;
    if (audio.paused) audio.play().catch(() => setError(true));
    else audio.pause();
  }, [current, error]);

  const seek = useCallback((seconds: number) => {
    audioRef.current!.currentTime = seconds;
    setTime(seconds);
  }, []);

  // Ao terminar, segue para a próxima faixa do mesmo álbum.
  const onEnded = () => {
    if (!current) return;
    const next = current.index + 1;
    if (next < current.album.tracks.length) load(current.album, next);
    else setPlaying(false);
  };

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        album: current?.album ?? null,
        index: current?.index ?? 0,
        playing,
        time,
        duration,
        error,
        play,
        toggle,
        seek,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={onEnded}
        onError={() => {
          if (audioRef.current?.getAttribute("src")) setError(true);
        }}
      />
    </PlayerContext.Provider>
  );
}
