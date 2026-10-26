# Slopfy

Catálogo musical pessoal e privado para as minhas demos. React + TypeScript + Vite, CSS puro, funções serverless da Vercel para a senha.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal. Sem configuração, a senha em desenvolvimento é `charliebrow`.
Para usar outra, copie `.env.example` para `.env.local` e altere `SLOPFY_PASSWORD`.

## Editar o catálogo

Tudo fica em [`src/data/albums.ts`](src/data/albums.ts):

- **Novo álbum:** adicione um objeto à lista e coloque a capa quadrada em `public/covers/`.
- **Nova versão de uma demo:** troque o `driveUrl` da faixa, mantendo a posição no array.
- A ordem das faixas é a ordem do array.

Cada faixa usa uma fonte de áudio:

- **`audioUrl`** — arquivo em `public/audio/` (ex.: `"/audio/demo-01.mp3"`). É a opção mais confiável. Use MP3/M4A
  (WAV é pesado para o Git) e lembre que o arquivo fica acessível por URL a quem souber o nome exato; nomes
  difíceis de adivinhar ajudam. Limite de 100 MB por arquivo na Vercel.
- **`driveUrl`** — link do Google Drive (veja abaixo). Se a faixa tiver os dois, vale o `audioUrl`.

**Artistas:** preencha `artist` no álbum e a biblioteca agrupa os álbuns por banda (sem `artist` em nenhum, não há agrupamento).

**Letras:** salve a letra como `.txt` em UTF-8 em `public/lyrics/` e use `lyricsUrl: "/lyrics/nome.txt"` na faixa.
Aparece um botão "Letra" ao lado dela. Como o áudio, o arquivo fica acessível por URL a quem souber o nome exato.

No Google Drive, o arquivo precisa estar com compartilhamento "Qualquer pessoa com o link".
Aceita `.../file/d/ID/view`, `.../open?id=ID` e `.../uc?id=ID`.

> A reprodução direta do Drive não é garantida: o Google pode bloquear (arquivos grandes, cotas, formato).
> Quando falha, o player mostra "Abrir no Drive". Arquivos MP3/M4A pequenos funcionam melhor.

## Publicar na Vercel

1. Envie o projeto para um repositório Git e importe-o na Vercel (o preset Vite é detectado sozinho).
2. Em **Settings → Environment Variables**, crie `SLOPFY_PASSWORD` com a senha desejada (Production).
3. Faça o deploy. Ao trocar a senha, refaça o deploy; as sessões antigas deixam de valer.

Em produção a variável é **obrigatória**: sem ela, o login responde erro 500 e ninguém entra.

## Como a proteção funciona

- `api/login` valida a senha no servidor (comparação em tempo constante) e emite um cookie assinado com HMAC
  (`HttpOnly`, `SameSite=Strict`, `Secure` em produção, validade de 30 dias). Nada de senha vai para o navegador.
- `api/catalog` só devolve os álbuns e links com sessão válida; o catálogo **não** é embutido no JavaScript do site.
- `api/logout` apaga o cookie (botão "Sair").

Limitação: as imagens em `public/covers/` são arquivos estáticos e podem ser abertas por quem souber a URL exata.
Os links do Drive, por serem públicos, também funcionam para quem os tiver.
