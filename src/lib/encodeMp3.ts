
const SAMPLE_RATE = 44100;
const BLOCK = 1152;

function toInt16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/** Decodifica qualquer áudio que o navegador entenda e gera um MP3 na taxa pedida a 44,1 kHz. */
export async function encodeMp3(file: File, kbps: number, onProgress: (ratio: number) => void): Promise<Blob> {
  // Criar o contexto em 44,1 kHz faz o navegador reamostrar durante a decodificação.
  const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
  let buffer: AudioBuffer;
  try {
    buffer = await ctx.decodeAudioData(await file.arrayBuffer());
  } finally {
    ctx.close();
  }

  const channels = Math.min(buffer.numberOfChannels, 2);
  const left = toInt16(buffer.getChannelData(0));
  const right = channels === 2 ? toInt16(buffer.getChannelData(1)) : undefined;
  const { Mp3Encoder } = await import("@breezystack/lamejs"); // carregado só quando usado
  const encoder = new Mp3Encoder(channels, SAMPLE_RATE, kbps);

  const parts: Uint8Array[] = [];
  for (let i = 0; i < left.length; i += BLOCK) {
    const chunk = encoder.encodeBuffer(left.subarray(i, i + BLOCK), right?.subarray(i, i + BLOCK));
    if (chunk.length) parts.push(chunk);
    // Devolve o controle ao navegador de tempos em tempos para a tela não travar.
    if ((i / BLOCK) % 400 === 0) {
      onProgress(i / left.length);
      await new Promise((r) => setTimeout(r));
    }
  }
  const end = encoder.flush();
  if (end.length) parts.push(end);
  onProgress(1);

  return new Blob(parts as BlobPart[], { type: "audio/mpeg" });
}
