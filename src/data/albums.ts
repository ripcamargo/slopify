import type { Album } from "../types";

// Único arquivo para editar o catálogo.
// - Novo álbum: adicione um objeto abaixo e coloque a capa em public/covers/.
// - Nova versão de uma demo: troque só o driveUrl da faixa, mantendo a posição.
// Cada faixa usa UMA das duas fontes de áudio (audioUrl tem prioridade se ambas existirem):
// - audioUrl: arquivo em public/audio/, ex.: "/audio/demo-01.mp3" (confiável, mas público por URL).
// - driveUrl: https://drive.google.com/file/d/ID/view, .../open?id=ID, .../uc?id=ID
// Opcionais: artist no álbum (agrupa a biblioteca por banda) e
// lyricsUrl na faixa, ex.: "/lyrics/nao-me-apegar.txt" (arquivo .txt UTF-8 em public/lyrics/).
export const albums: Album[] = [
  {
    id: "album-01",
    artist: "Chovendin",
    title: "EP - Mares Inavegáveis",
    cover: "/covers/capa_mares.jpg",
    year: 2025,
    description: "",
    tracks: [
      {
        id: "track-01",
        title: "Não me apegar",
        lyricsUrl: "/lyrics/nao-me-apegar.txt",
        audioUrl: "/audio/Mares Inavegáveis/não me apegar.mp3",
      },
      {
        id: "track-02",
        title: "O amanhã não vem",
        lyricsUrl: "/lyrics/o-amanha-nao-vem.txt",
        audioUrl: "/audio/Mares Inavegáveis/O amanhã não vem.mp3",
      },
      {
        id: "track-03",
        title: "Difícil demais",
        lyricsUrl: "/lyrics/dificil-demais.txt",
        audioUrl: "/audio/Mares Inavegáveis/foi difícil de mais.mp3",
      },
      {
        id: "track-04",
        title: "Você nem notou",
        audioUrl: "/audio/Mares Inavegáveis/você nem notou.mp3",
      },
      {
        id: "track-05",
        title: "Dois pesos e duas medidas",
        audioUrl: "/audio/Mares Inavegáveis/dois-pesos-e-duas-medidas.mp3",
      },
      {
        id: "track-06",
        title: "Cuida de mim",
        audioUrl: "/audio/Mares Inavegáveis/cuida-de-mim.mp3",
      },
      {
        id: "track-07",
        title: "Como você sonhou",
        audioUrl: "/audio/Mares Inavegáveis/como-você-sonhou.mp3",
      },
      {
        id: "track-08",
        title: "Como eu queria que fosse você",
        audioUrl: "/audio/Mares Inavegáveis/como-eu-queria-que-fosse-você.mp3",
      },
      {
        id: "track-09",
        title: "Assunto da sua Terapia",
        audioUrl: "/audio/Mares Inavegáveis/assunto-da-sua-terapia.mp3",
      },
      {
        id: "track-10",
        title: "Deixar você Respirar",
        audioUrl: "/audio/Mares Inavegáveis/deixar-você-respirar.mp3",
      },
      {
        id: "track-11",
        title: "Tem me atrapalhado pra viver",
        audioUrl: "/audio/Mares Inavegáveis/tem-me-atrapalhado-pra-viver.mp3",
      },
      {
        id: "track-12",
        title: "Sei que você vai lembrar de mim",
        audioUrl: "/audio/Mares Inavegáveis/sei-que-você-vai-lembrar-de-mim.mp3",
      },
      {
        id: "track-13",
        title: "O nó do teu cabelo",
        audioUrl: "/audio/Mares Inavegáveis/o-nó-do-teu-cabelo.mp3",
      },
    ],
  },
  {
    id: "album-02",
    artist: "Chovendin",
    title: "EP - Antigo Presente de um Sujeito sem Dinheiro",
    cover: "/covers/capa_antigo.jpg",
    year: 2023,
    tracks: [
      {
        id: "track-01",
        title: "Antigo presente de um sujeito sem dinheiro",
        audioUrl: "/audio/Antigo Presente/1. Antigo presente de um sujeito sem dinheiro.mp3",
      },
      {
        id: "track-02",
        title: "15 de Junho",
        audioUrl: "/audio/Antigo Presente/2. 15 de Junho.mp3",
      },
      {
        id: "track-03",
        title: "Colecionando Situações",
        audioUrl: "/audio/Antigo Presente/3. colecionando.mp3",
      },
      {
        id: "track-04",
        title: "Distância",
        audioUrl: "/audio/Antigo Presente/4. Distância.mp3",
      },
      {
        id: "track-05",
        title: "Eu sou tua lenha",
        audioUrl: "/audio/Antigo Presente/5. Eu sou tua lenha.mp3",
      },
      {
        id: "track-06",
        title: "A gente segue o jogo",
        audioUrl: "/audio/Antigo Presente/6. A gente segue o jogo.mp3",
      },
    ],
  },

  {
    id: "album-03",
    artist: "Chovendin",
    title: "Sem álbum",
    cover: "/covers/capa_semalbum.JPG",
    year: 2026,
    tracks: [
      {
        id: "track-01",
        title: "Que pena amor",
        audioUrl: "/audio/Outros/que-pena-amor.mp3",
      },
      {
        id: "track-02",
        title: "Meia Noite e Um",
        audioUrl: "/audio/Outros/meia-noite-e-um.mp3",
      },
      {
        id: "track-03",
        title: "Restos Viscerais",
        audioUrl: "/audio/Outros/restos-viscerais.mp3",
      },
      {
        id: "track-04",
        title: "Teus Stories",
        audioUrl: "/audio/Outros/teus-stories.mp3",
      },
      
    ],
  },
];
