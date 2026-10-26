export interface Track {
  id: string;
  title: string;
  /** Arquivo local em public/, ex.: "/audio/demo-01.mp3". Tem prioridade sobre driveUrl. */
  audioUrl?: string;
  /** Link público de compartilhamento do Google Drive. */
  driveUrl?: string;
  /** Letra em texto puro. */
  lyrics?: string;
}

export interface Album {
  id: string;
  title: string;
  /** Banda ou artista; a biblioteca agrupa os álbuns por este nome. */
  artist?: string;
  /** Caminho da capa dentro de public/ (ex.: "/covers/album-01.jpg") ou imagem enviada pelo app (data URL). */
  cover: string;
  year?: number;
  description?: string;
  /** A ordem do array é a ordem de exibição. */
  tracks: Track[];
}

/** Arquivos disponíveis em public/ para escolher no editor. */
export interface Media {
  audio: string[];
  covers: string[];
}
