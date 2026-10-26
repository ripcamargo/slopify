import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { encodeMp3 } from "../lib/encodeMp3";

type Item = {
  id: number;
  name: string;
  before: number;
  status: "working" | "done" | "skip" | "error";
  progress: number;
  after?: number;
  url?: string;
  outName?: string;
  message?: string;
};

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
// MP3/AAC já são comprimidos: reencodar só perderia qualidade.
const ALREADY_COMPRESSED = /\.(mp3|m4a|aac|ogg|opus)$/i;

function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

export default function Optimizer() {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [reduceKbps, setReduceKbps] = useState(0); // 0 = não alterar MP3/M4A já existentes
  const nextId = useRef(0);

  const patch = (id: number, changes: Partial<Item>) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...changes } : it)));

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    process(Array.from(e.target.files ?? []));
    e.target.value = "";
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    process(Array.from(e.dataTransfer.files));
  }

  async function process(files: File[]) {
    if (files.length === 0) return;

    // Arquivos já comprimidos só são reencodados se você escolheu reduzir (com perda).
    const skipped = (f: File) => ALREADY_COMPRESSED.test(f.name) && reduceKbps === 0;
    const added: Item[] = files.map((f) => ({
      id: nextId.current++,
      name: f.name,
      before: f.size,
      status: skipped(f) ? "skip" : "working",
      progress: 0,
      message: skipped(f)
        ? "Já é um formato comprimido; reduzir mais exigiria perder qualidade. Use o arquivo como está."
        : undefined,
    }));
    setItems((list) => [...added, ...list]);

    for (let i = 0; i < files.length; i++) {
      const item = added[i];
      if (item.status !== "working") continue;
      const reducing = ALREADY_COMPRESSED.test(item.name);
      const kbps = reducing ? reduceKbps : 320;
      try {
        const blob = await encodeMp3(files[i], kbps, (p) => patch(item.id, { progress: p }));
        if (reducing && blob.size >= item.before) {
          patch(item.id, {
            status: "skip",
            message: `Ficaria maior (${mb(blob.size)}) que o original; ele já está abaixo de ${kbps} kbps. Use o arquivo como está.`,
          });
          continue;
        }
        const url = URL.createObjectURL(blob);
        const base = item.name.replace(/\.[^.]+$/, "");
        const outName = `${base}${reducing ? ` - ${kbps}k` : ""}.mp3`;
        patch(item.id, { status: "done", after: blob.size, url, outName });
        download(url, outName);
      } catch {
        patch(item.id, { status: "error", message: "Não consegui ler este arquivo neste navegador." });
      }
    }
  }

  return (
    <>
      <h1>Otimizador de faixas</h1>
      <p className="muted opt-intro">
        Converte WAV, FLAC e similares para MP3 320 kbps (44,1 kHz), bem menor e praticamente indistinguível do original.
        Tudo acontece no seu navegador: o arquivo não é enviado a lugar nenhum. O resultado é baixado automaticamente;
        depois coloque-o em <code>public/audio/</code>.
      </p>

      <div className="opt-option">
        <label>
          Arquivos que já são MP3/M4A:{" "}
          <select value={reduceKbps} onChange={(e) => setReduceKbps(Number(e.target.value))}>
            <option value={0}>Não alterar (recomendado)</option>
            <option value={256}>Reduzir para 256 kbps</option>
            <option value={192}>Reduzir para 192 kbps</option>
            <option value={128}>Reduzir para 128 kbps</option>
          </select>
        </label>
        {reduceKbps > 0 && (
          <p className="muted">
            Reduzir um MP3 reencoda o áudio e perde qualidade. Quanto menor a taxa, mais audível. Guarde o original.
          </p>
        )}
      </div>

      <label
        className={dragging ? "drop dragging" : "drop"}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input type="file" accept="audio/*,.wav,.flac,.aif,.aiff" multiple onChange={onPick} />
        <span>Arraste arquivos de áudio aqui ou clique para escolher</span>
      </label>

      <ul className="opt-list">
        {items.map((it) => (
          <li key={it.id}>
            <div className="opt-main">
              <strong>{it.name}</strong>
              <span className="muted">
                {it.status === "working" && `Otimizando… ${Math.round(it.progress * 100)}%`}
                {it.status === "done" && `${mb(it.before)} → ${mb(it.after!)}  (${it.outName})`}
                {(it.status === "skip" || it.status === "error") && it.message}
              </span>
              {it.status === "working" && (
                <progress value={it.progress} max={1} />
              )}
            </div>
            {it.status === "done" && (
              <button className="btn-primary opt-btn" onClick={() => download(it.url!, it.outName!)}>
                Baixar
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
