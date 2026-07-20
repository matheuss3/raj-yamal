# raj-yamal

Sistema de gestão de gastos mensais para controle financeiro familiar. Veja `docs/requisitos.txt` (requisitos) e `docs/plano-desenvolvimento.md` (arquitetura e roadmap).

## Stack

React + Vite + TypeScript no frontend, Netlify Functions + Netlify Blobs na persistência, publicado na Netlify.

## Rodando localmente

```bash
npm install

# só o frontend (sem as Netlify Functions)
npm run dev

# frontend + Netlify Functions + Netlify Blobs (recomendado)
npm run dev:netlify
```

`npm run dev:netlify` sobe o Vite e as Functions juntos atrás de um proxy local (`http://localhost:8888`), com as chamadas a `/api/*` roteadas para `netlify/functions/*` conforme `netlify.toml`. Não é necessário configurar credenciais manualmente — o Netlify Blobs recebe as credenciais automaticamente do runtime local/de produção.

## Build

```bash
npm run build
```

## Deploy

1. **Login e link com o site na Netlify** (uma vez só, interativo — rode você mesmo no terminal):
   ```bash
   npx netlify login
   npx netlify init      # cria um site novo, ou `netlify link` se já existir um
   ```
2. **(Opcional, recomendado) Isolar dados de preview da produção:** em *Site settings → Environment variables*, crie `BLOBS_STORE_SUFFIX` com escopo incluindo **Functions** (variáveis só do `netlify.toml` não chegam nas Functions em runtime) e "different value per deploy context" — deixe vazio em **Production** e algo como `-preview` em **Deploy Previews**/**Branch deploys**. Sem isso, deploy previews e produção compartilham a mesma store de contas (`accounts`), já que o padrão do Netlify Blobs é site-scoped.
3. **Deploy:**
   ```bash
   npx netlify deploy --prod   # produção
   npx netlify deploy          # preview
   ```
   Ou conecte o repositório Git pelo painel da Netlify para deploys automáticos a cada push (`npm run build` como build command, `dist` como publish directory — já configurado em `netlify.toml`).

Nenhuma credencial de banco/API precisa ser configurada manualmente: o Netlify Blobs recebe `siteID`/token automaticamente do runtime, tanto local (via `netlify dev`, depois de `netlify link`) quanto em produção.

## Estrutura

Ver seção 2 (`Estrutura de pastas`) de `docs/plano-desenvolvimento.md`.
