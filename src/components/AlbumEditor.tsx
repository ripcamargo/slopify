import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Album, Media, Track } from "../types";
import { deleteAlbum, fetchMedia, newId, saveAlbum, titleFromFile } from "../api";
import { CloseIcon, DownIcon, UpIcon } from "../icons";

interface Props {
  /** Ausente ao criar um álbum novo. */
  album?: Album;
  albums: Album[];
  onSaved: (album: Album) => void;
  onDeleted?: (id: string) => void;
}

const folderOf = (path: string) => path.slice(0, path.lastIndexOf("/"));

/** Recorta a imagem ao centro num quadrado de até 600 px e devolve um JPEG em data URL. */
async function squareCover(file: File, size = 600): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(size, side);
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

interface TrackRowProps {
  track: Track;
  index: number;
  count: number;
  media: Media | null;
  onChange: (changes: Partial<Track>) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}

function TrackRow({ track, index, count, media, onChange, onMove, onRemove }: TrackRowProps) {
  const [open, setOpen] = useState(false);
  const missing = !!track.audioUrl && !!media?.audio.length && !media.audio.includes(track.audioUrl);

  function setAudio(audioUrl: string) {
    const known = media?.audio.includes(audioUrl);
    onChange(!track.title.trim() && known ? { audioUrl, title: titleFromFile(audioUrl) } : { audioUrl });
  }

  return (
    <li className="edit-track">
      <div className="edit-track-row">
        <span className="track-num">{index + 1}</span>
        <input
          className="input"
          placeholder="Título"
          aria-label={`Título da faixa ${index + 1}`}
          value={track.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <input
          className="input"
          list="audio-files"
          placeholder="/audio/arquivo.mp3"
          aria-label={`Arquivo de áudio da faixa ${index + 1}`}
          value={track.audioUrl ?? ""}
          onChange={(e) => setAudio(e.target.value)}
        />
        <div className="edit-track-tools">
          <button type="button" className={track.lyrics || track.driveUrl ? "chip chip-on" : "chip"} onClick={() => setOpen(!open)} aria-expanded={open}>
            Letra/Drive
          </button>
          <button type="button" className="icon-btn" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Subir faixa">
            <UpIcon />
          </button>
          <button type="button" className="icon-btn" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Descer faixa">
            <DownIcon />
          </button>
          <button type="button" className="icon-btn" onClick={onRemove} aria-label="Remover faixa">
            <CloseIcon />
          </button>
        </div>
      </div>
      {missing && <p className="hint">Arquivo não encontrado em public/. Confira maiúsculas e acentos.</p>}
      {open && (
        <div className="edit-track-more">
          <label className="field">
            <span>Link do Google Drive (usado se não houver arquivo)</span>
            <input className="input" value={track.driveUrl ?? ""} onChange={(e) => onChange({ driveUrl: e.target.value })} />
          </label>
          <label className="field">
            <span>Letra</span>
            <textarea className="input" rows={10} value={track.lyrics ?? ""} onChange={(e) => onChange({ lyrics: e.target.value })} />
          </label>
        </div>
      )}
    </li>
  );
}

export default function AlbumEditor({ album, albums, onSaved, onDeleted }: Props) {
  const [draft, setDraft] = useState<Album>(() => album ?? { id: newId(), title: "", cover: "", tracks: [] });
  const [media, setMedia] = useState<Media | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMedia().then(setMedia, () => setMedia({ audio: [], covers: [] }));
  }, []);

  const artists = [...new Set(albums.map((a) => a.artist).filter(Boolean))];
  const folders = [...new Set(media?.audio.map(folderOf))];
  const used = new Set(draft.tracks.map((t) => t.audioUrl));
  const backHref = album ? `#/album/${encodeURIComponent(album.id)}` : "#/";

  const set = (changes: Partial<Album>) => setDraft((d) => ({ ...d, ...changes }));
  const setTracks = (update: (tracks: Track[]) => Track[]) => setDraft((d) => ({ ...d, tracks: update(d.tracks) }));

  function moveTrack(index: number, delta: number) {
    setTracks((tracks) => {
      const list = [...tracks];
      const [item] = list.splice(index, 1);
      list.splice(index + delta, 0, item);
      return list;
    });
  }

  function addFolder(folder: string) {
    const files = media!.audio.filter((f) => folderOf(f) === folder && !used.has(f));
    setTracks((tracks) => [...tracks, ...files.map((audioUrl) => ({ id: newId(), title: titleFromFile(audioUrl), audioUrl }))]);
  }

  async function uploadCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      set({ cover: await squareCover(file) });
    } catch {
      setError("Não consegui ler esta imagem.");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const tracks = draft.tracks.map((t) => ({ ...t, title: t.title.trim() || (t.audioUrl ? titleFromFile(t.audioUrl) : "") }));
      onSaved(await saveAlbum({ ...draft, tracks }));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!album || !confirm(`Excluir "${album.title}"? Os arquivos em public/ não são apagados.`)) return;
    setBusy(true);
    try {
      await deleteAlbum(album.id);
      onDeleted?.(album.id);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="editor" onSubmit={submit}>
      <a className="back" href={backHref}>← Voltar</a>
      <h1>{album ? "Editar álbum" : "Novo álbum"}</h1>

      <div className="editor-head">
        <div className="cover-edit">
          <img src={draft.cover || undefined} alt="" />
          <select
            className="input"
            aria-label="Capa em public/covers"
            value={media?.covers.includes(draft.cover) ? draft.cover : ""}
            onChange={(e) => e.target.value && set({ cover: e.target.value })}
          >
            <option value="">{draft.cover.startsWith("data:") ? "Imagem enviada" : "Escolher de public/covers…"}</option>
            {media?.covers.map((c) => (
              <option key={c} value={c}>{c.replace("/covers/", "")}</option>
            ))}
          </select>
          <label className="btn file-btn">
            Enviar imagem
            <input type="file" accept="image/*" onChange={uploadCover} />
          </label>
        </div>

        <div className="editor-fields">
          <label className="field">
            <span>Título</span>
            <input className="input" required value={draft.title} onChange={(e) => set({ title: e.target.value })} />
          </label>
          <label className="field">
            <span>Artista</span>
            <input className="input" list="artists" value={draft.artist ?? ""} onChange={(e) => set({ artist: e.target.value })} />
          </label>
          <label className="field field-sm">
            <span>Ano</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={draft.year ?? ""}
              onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : undefined })}
            />
          </label>
          <label className="field">
            <span>Descrição</span>
            <input className="input" value={draft.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
          </label>
        </div>
      </div>

      <h2 className="editor-section">Faixas</h2>
      <ol className="edit-tracks">
        {draft.tracks.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i}
            count={draft.tracks.length}
            media={media}
            onChange={(changes) => setTracks((list) => list.map((t) => (t.id === track.id ? { ...t, ...changes } : t)))}
            onMove={(delta) => moveTrack(i, delta)}
            onRemove={() => setTracks((list) => list.filter((t) => t.id !== track.id))}
          />
        ))}
      </ol>
      <div className="actions">
        <button type="button" className="btn" onClick={() => setTracks((list) => [...list, { id: newId(), title: "" }])}>
          + Faixa
        </button>
        {folders.length > 0 && (
          <select className="input input-inline" value="" onChange={(e) => e.target.value && addFolder(e.target.value)} aria-label="Adicionar todas as faixas de uma pasta">
            <option value="">+ Todas de uma pasta…</option>
            {folders.map((f) => (
              <option key={f} value={f}>{f.replace("/audio", "") || "/"}</option>
            ))}
          </select>
        )}
      </div>
      <p className="muted hint">
        Os arquivos de áudio ficam em <code>public/audio/</code> e vão para o Git; aqui você só escolhe qual usar.
      </p>

      <datalist id="audio-files">
        {media?.audio.filter((f) => !used.has(f)).map((f) => <option key={f} value={f} />)}
      </datalist>
      <datalist id="artists">
        {artists.map((a) => <option key={a} value={a} />)}
      </datalist>

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="editor-footer">
        <button className="btn-primary btn-save" disabled={busy || !draft.title.trim()}>
          {busy ? "Salvando…" : "Salvar"}
        </button>
        <a className="btn" href={backHref}>Cancelar</a>
        {album && (
          <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>
            Excluir álbum
          </button>
        )}
      </div>
    </form>
  );
}
