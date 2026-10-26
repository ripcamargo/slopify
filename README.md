# Slopfy

Catálogo musical pessoal e privado para as minhas demos. React + TypeScript + Vite, CSS puro, funções serverless
da Vercel para a senha e para o catálogo, que fica no Firestore.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal. O catálogo exige o Firebase configurado (veja abaixo). Sem configuração, a senha em desenvolvimento é `charliebrow`.
Para usar outra, copie `.env.example` para `.env.local` e altere `SLOPFY_PASSWORD`.

## Firebase (onde o catálogo fica salvo)

Álbuns, faixas, ordem, letras e capas enviadas pelo app ficam no Firestore do projeto `dailycheckmaromba`.
Só as funções da Vercel acessam o banco, com uma conta de serviço; o navegador nunca fala com o Firebase.

1. No [console do Firebase](https://console.firebase.google.com/project/dailycheckmaromba/firestore), crie o banco
   **Firestore** em modo de produção (região sugerida: `southamerica-east1`). Mantenha as regras bloqueando tudo
   (`allow read, write: if false;`): a conta de serviço não passa por elas.
2. Em **Configurações do projeto → Contas de serviço → Gerar nova chave privada**, baixe o JSON.
   Não coloque esse arquivo no Git.
3. Gere o base64 da chave (PowerShell):
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("caminho\da\chave.json")) | Set-Clipboard
   ```
   e cole em `.env.local` como `FIREBASE_SERVICE_ACCOUNT=...` (copie de `.env.example`).
4. Importe o catálogo antigo uma vez: `npm run seed`. Ele lê `scripts/legacy-albums.ts`, embute as letras de
   `public/lyrics/` e corrige caminhos de áudio com maiúsculas/acentos diferentes do arquivo real.
   Depois disso, `scripts/legacy-albums.ts` e `public/lyrics/` podem ser apagados.

## Editar o catálogo

Tudo pelo app:

- **Novo álbum:** botão "Novo álbum" na biblioteca.
- **Editar:** botão "Editar" na página do álbum: título, artista, ano, descrição, capa e faixas
  (adicionar, renomear, reordenar, remover, letra, link do Drive). "Todas de uma pasta" adiciona de uma vez as
  músicas de uma pasta de `public/audio/`.
- **Ordem dos álbuns:** botão "Organizar" na biblioteca.
- **Capa:** escolha um arquivo de `public/covers/` ou envie uma imagem; ela é recortada em quadrado de 600 px e
  salva no Firestore.

Os **arquivos de áudio continuam no repositório**, em `public/audio/` (MP3/M4A; WAV é pesado para o Git; limite
de 100 MB por arquivo na Vercel). Para uma música nova: coloque o arquivo na pasta, faça commit e deploy, e então
escolha-o no editor. A lista de arquivos é gerada em `server/media.json` a cada build e sempre que o app roda
localmente; faça commit dele junto. Lembre que os arquivos ficam acessíveis por URL a quem souber o nome exato.

Cada faixa usa uma fonte de áudio: o arquivo de `public/audio/` ou um link do Google Drive. Se tiver os dois,
vale o arquivo. No Drive, o compartilhamento precisa ser "Qualquer pessoa com o link"; aceita `.../file/d/ID/view`,
`.../open?id=ID` e `.../uc?id=ID`.

> A reprodução direta do Drive não é garantida: o Google pode bloquear (arquivos grandes, cotas, formato).
> Quando falha, o player mostra "Abrir no Drive". Arquivos MP3/M4A pequenos funcionam melhor.

## Publicar na Vercel

1. Envie o projeto para um repositório Git e importe-o na Vercel (o preset Vite é detectado sozinho).
2. Em **Settings → Environment Variables**, crie `SLOPFY_PASSWORD` com a senha desejada e
   `FIREBASE_SERVICE_ACCOUNT` com o mesmo base64 do `.env.local` (Production).
3. Faça o deploy. Ao trocar a senha, refaça o deploy; as sessões antigas deixam de valer.

Em produção a variável é **obrigatória**: sem ela, o login responde erro 500 e ninguém entra.

## Como a proteção funciona

- `api/login` valida a senha no servidor (comparação em tempo constante) e emite um cookie assinado com HMAC
  (`HttpOnly`, `SameSite=Strict`, `Secure` em produção, validade de 30 dias). Nada de senha vai para o navegador.
- `api/catalog`, `api/albums`, `api/order` e `api/media` só respondem com sessão válida; o catálogo **não** é
  embutido no JavaScript do site.
- `api/logout` apaga o cookie (botão "Sair").

Limitação: as imagens em `public/covers/` são arquivos estáticos e podem ser abertas por quem souber a URL exata.
Os links do Drive, por serem públicos, também funcionam para quem os tiver.
