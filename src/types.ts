export interface Track {
  id: string;
  title: string;
  /** Arquivo local em public/, ex.: "/audio/demo-01.mp3". Tem prioridade sobre driveUrl. */
  audioUrl?: string;
  /** Link público de compartilhamento do Google Drive. */
  driveUrl?: string;
  /** Arquivo .txt (UTF-8) em public/lyrics/, ex.: "/lyrics/demo-01.txt". */
  lyricsUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  /** Banda ou artista; a biblioteca agrupa os álbuns por este nome. */
  artist?: string;
  /** Caminho da capa quadrada dentro de public/, ex.: "/covers/album-01.jpg". */
  cover: string;
  year?: number;
  description?: string;
  /** A ordem do array é a ordem de exibição. */
  tracks: Track[];
}
