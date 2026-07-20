# Plano de Desenvolvimento — Sistema de Gestão de Gastos Familiares

> Baseado em `docs/requisitos.txt`. Este documento é o roadmap técnico do projeto: arquitetura, estrutura de pastas, sistema de design, componentes, fases de entrega, riscos e caminho de evolução futura.

## Decisões técnicas

- **Stack:** React + Vite + TypeScript.
- **Persistência:** Netlify Functions + Netlify Blobs. Um blob JSON por conta, indexado pelo hash da conta, em uma store *site-scoped* (persiste entre deploys — não é apagada a cada novo build).
- **Deploy:** Netlify (build estático do frontend + Netlify Functions).
- **Estilo:** tokens visuais e fontes extraídos do repositório de referência [ZeroDelay](https://github.com/joaogfc/ZeroDelay) (`popup.css` + `fonts/`) — é a inspiração forte de design do projeto, tanto na paleta/tipografia/motion quanto no asset real da fonte Departure Mono (ver seção 3.1.1).

---

## 1. Arquitetura geral

```
┌─────────────────────────┐        HTTPS (fetch)        ┌──────────────────────────┐
│  Frontend (React+Vite)  │  ───────────────────────►   │  Netlify Functions (TS)  │
│  SPA estática servida   │  header X-Account-Hash       │  netlify/functions/*.ts  │
│  pelo Netlify CDN       │  ◄───────────────────────    │                          │
└─────────────────────────┘        JSON                  └────────────┬─────────────┘
                                                                        │ @netlify/blobs
                                                                        ▼
                                                          ┌──────────────────────────┐
                                                          │  Netlify Blobs (site-     │
                                                          │  scoped store "accounts") │
                                                          │  1 objeto JSON por conta, │
                                                          │  chave = hash da conta    │
                                                          └──────────────────────────┘
```

**Regras da arquitetura:**
- O frontend nunca acessa o Blob diretamente — só via Functions (`@netlify/blobs` só roda em ambiente servidor).
- O hash da conta vai sempre em um header custom `X-Account-Hash`, nunca em query string/URL (evita vazar em logs, histórico do navegador ou Referer).
- A store deve ser configurada com `consistency: "strong"` — por padrão o Netlify Blobs usa consistência eventual (até 60s de propagação entre regiões), o que criaria risco real de um dispositivo ler dados desatualizados logo após um gasto ser registrado em outro.
- Concorrência entre dispositivos é tratada com o mecanismo nativo de ETag do SDK: `store.getWithMetadata(key)` retorna `{ data, etag }`; `store.set(key, value, { onlyIfMatch: etag })` só grava se nada mudou nesse meio tempo (senão retorna conflito e a Function tenta de novo com o dado mais recente).
- Limite de 5GB por objeto no Blob — folga enorme para uso familiar.

### Schema do JSON persistido (1 blob por conta)

```jsonc
{
  "accountHash": "b7k4-2xqf-91mz-caw2",
  "schemaVersion": 1,
  "createdAt": "2026-07-19T12:00:00.000Z",
  "updatedAt": "2026-07-19T18:32:10.000Z",

  "tags": [
    {
      "id": "b3e1f7a0-...",
      "name": "Mercado",
      "color": "#ff2d52",
      "monthlyBudget": 80000,   // centavos (R$ 800,00) — null = sem orçamento definido
      "archived": false,
      "createdAt": "..."
    }
  ],

  "purchases": [
    {
      "id": "9f2c...",
      "description": "Compra do mês",
      "amountCents": 15890,     // inteiro, nunca float
      "date": "2026-07-19",
      "tagId": "b3e1f7a0-...",   // nullable — compra sem etiqueta é permitida
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Decisões de schema:**
- Valores monetários sempre em **centavos, inteiros** — elimina problemas de ponto flutuante e casa naturalmente com o input estilo Nubank.
- Orçamento ideal é um campo da própria tag (`monthlyBudget`), recorrente mês a mês, não uma coleção separada — mais simples e fiel à história de usuário 5. Se no futuro for necessário orçamento diferente por mês/ano, o campo pode evoluir para um mapa `{ "2026-07": 80000, ... }` sem quebrar compatibilidade (por isso o `schemaVersion`).
- **Preferência de tema fica fora do blob**, só em `localStorage` do dispositivo — é preferência de UI local, não dado financeiro a sincronizar.

### Fluxo de autenticação por hash

**Conta nova:**
1. No boot, o frontend lê `localStorage['raj-yamal:accountHash']`.
2. Se vazio → onboarding com "Criar conta" ou "Já tenho uma conta".
3. "Criar conta" → `POST /api/account` (sem corpo). A Function gera um hash server-side com ~128 bits de entropia, formatado em blocos legíveis (`b7k4-2xqf-91mz-caw2`), cria o blob inicial (`tags: [], purchases: []`) e retorna `{ hash }`.
4. Frontend grava no `localStorage` e segue para o app, exibindo o hash em destaque com botão de copiar.

**Login em outro dispositivo:**
1. "Já tenho uma conta" → campo para colar/digitar o hash.
2. `GET /api/account` com `X-Account-Hash: <valor digitado>`.
3. Existe → grava no `localStorage` local e carrega os dados. Não existe → erro claro, sem criar conta nova automaticamente.

**Hash como segredo (não é só um ID):** nunca em query string, nunca logado; tela "Conta" mostra o hash mascarado por padrão (tipo campo de senha) com botão revelar/copiar; "Sair" só limpa o `localStorage` local, não afeta o blob.

---

## 2. Estrutura de pastas

```
raj-yamal/
├── docs/
│   ├── requisitos.txt
│   └── plano-desenvolvimento.md
├── netlify/
│   └── functions/
│       ├── account.ts          # POST cria conta, GET valida/retorna dados
│       ├── purchases.ts        # POST/PUT/DELETE (read-modify-write com etag)
│       ├── tags.ts             # POST/PUT/DELETE
│       └── _lib/
│           ├── blobStore.ts    # wrapper getStore + getWithMetadata + retry-on-conflito
│           ├── hash.ts         # geração/validação de formato do hash
│           ├── http.ts         # helpers de Response, CORS, erros padronizados
│           └── validation.ts   # validação de payloads (tamanho, tipo, limites)
├── shared/
│   └── types.ts                # AccountData, Purchase, Tag — usado por front e functions
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   ├── client.ts           # fetch wrapper injeta X-Account-Hash
│   │   ├── account.ts
│   │   ├── purchases.ts
│   │   └── tags.ts
│   ├── state/
│   │   └── AccountDataProvider.tsx
│   ├── features/
│   │   ├── account/            # onboarding, tela de hash, trocar conta
│   │   ├── purchases/          # formulário, lista, filtro por mês, card de total
│   │   ├── tags/                # CRUD, seletor de cor, orçamento
│   │   └── theme/               # provider + toggle
│   ├── components/
│   │   ├── ui/                 # Button (sticker-pop), Card, Chip, Modal, Toggle
│   │   └── money/
│   │       └── CurrencyInput.tsx
│   ├── assets/
│   │   └── fonts/
│   │       ├── DepartureMono-Regular.woff2  # copiado literalmente do repo ZeroDelay
│   │       └── OFL.txt                      # licença da fonte, copiada junto (atribuição)
│   ├── styles/
│   │   ├── tokens.css          # variáveis extraídas do ZeroDelay
│   │   ├── fonts.css           # @font-face da Departure Mono self-hosted
│   │   └── global.css          # reset, tipografia base, mobile-first
│   └── utils/
│       ├── currency.ts         # cents <-> "R$ 0,00" (Intl.NumberFormat pt-BR)
│       └── date.ts             # helpers de mês/ano
├── netlify.toml
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

> Nota técnica: validar no Fase 0 que o bundler de Functions da Netlify (esbuild) resolve corretamente o import de `shared/types.ts` a partir de `netlify/functions/`, tanto local (`netlify dev`) quanto em deploy real de preview.

---

## 3. Sistema de design

Tokens extraídos diretamente do `popup.css` do repositório de referência ZeroDelay.

### 3.1 Tokens (`src/styles/tokens.css`)

```css
:root {
  /* cores — dark (padrão) */
  --bg-0: #0f0f0f;
  --bg-1: #1c1c1c;
  --bg-2: #272727;
  --bg-3: #323232;
  --text-primary: #f1f1f1;
  --text-dim: #aaaaaa;
  --text-faint: #717171;
  --accent: #ff0033;
  --accent-strong: #ff2d52;
  --success: #2ba640;
  --warning: #ffc43d;
  --accent-soft-alpha: 0.14;
  --accent-glow-alpha: 0.35;

  /* tipografia */
  --font-sans: "Roboto", "Segoe UI", system-ui, -apple-system, sans-serif;
  --font-mono: "Departure Mono", ui-monospace, monospace; /* valores monetários */

  /* raio */
  --radius: 12px;
  --radius-sm: 9px;

  /* motion */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-spring: cubic-bezier(0.2, 0.9, 0.25, 1.18);
  --transition-color: 160ms;
  --transition-transform: 120ms;
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg-0: #ffffff;
    --bg-1: #f9f9f9;
    --bg-2: #f0f0f0;
    --bg-3: #e7e7e7;
    --text-primary: #0f0f0f;
    --text-dim: #606060;
    --text-faint: #909090;
    --accent-soft-alpha: 0.10;
  }
}
[data-theme="light"] { /* mesmos overrides acima, forçados */ }
[data-theme="dark"]  { /* reforça valores dark mesmo com SO em light */ }
```

### 3.1.1 Fontes (assets reais do ZeroDelay)

Verifiquei diretamente a pasta `fonts/` do repositório ([conteúdo via GitHub API](https://api.github.com/repos/joaogfc/ZeroDelay/contents/fonts)) para saber exatamente o que dá para reaproveitar como asset, não só como nome de família:

| Fonte | No repositório ZeroDelay | Decisão para o raj-yamal |
|---|---|---|
| **Departure Mono** | Arquivo real bundlado: `fonts/DepartureMono-Regular.woff2` (22KB), com `fonts/OFL.txt` (licença SIL Open Font License) na mesma pasta. Declarada via `@font-face` com `font-weight: 400 700` (fonte variável) e `font-display: swap`. | **Copiar o arquivo `.woff2` de verdade** do repositório para `src/assets/fonts/DepartureMono-Regular.woff2`, junto com `OFL.txt` (a licença exige manter o arquivo de licença junto da fonte redistribuída). `@font-face` local idêntica ao original. |
| **Roboto** | **Não está bundlada no repositório** — só aparece como nome no fallback `--font: "Roboto", "Segoe UI", system-ui, ...`; o ZeroDelay é uma extensão MV3 e evita carregar recursos remotos, então conta com Roboto já estar instalada no SO/Chrome. | Como não existe arquivo de Roboto no repo para copiar, vamos carregar Roboto via **Google Fonts** (fonte oficial do próprio Google, mesma família), com `<link rel="preconnect">` + `@font-face`/`<link>` padrão, mantendo `"Segoe UI", system-ui, -apple-system, sans-serif` como fallback igual ao original. |

```css
/* src/styles/fonts.css — Departure Mono self-hosted, cópia literal do asset do ZeroDelay */
@font-face {
  font-family: "Departure Mono";
  src: url("../assets/fonts/DepartureMono-Regular.woff2") format("woff2");
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}
```

**Pronto quando (critério a checar no Fase 0/4):** confirmar que `OFL.txt` foi copiado junto do `.woff2` (atribuição exigida pela licença) e que o app referencia a fonte local, não um CDN externo, para Departure Mono.

**Mecanismo de tema:** `data-theme` no `<html>` controlado por um `ThemeProvider`. Três estados salvos em `localStorage['raj-yamal:theme']`: `"system"` (default, segue `prefers-color-scheme`), `"light"`, `"dark"`. Toggle acessível pela navegação (1 clique alterna, ciclo system→dark→light→system).

**Foco visível:** `outline: 2px solid var(--accent); outline-offset: 2px` em todos os controles — importante para acessibilidade e para manter a identidade visual do ZeroDelay.

### 3.2 Botão "sticker pop"

```css
.btn {
  border-radius: var(--radius-sm);
  box-shadow: 3px 3px 0 0 #000;
  transition: background-color var(--transition-color) var(--ease-standard),
              transform var(--transition-transform) var(--ease-standard);
}
.btn:hover  { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 0 #000; }
.btn:active { transform: translate(3px, 3px);  box-shadow: 0 0 0 0 #000; }

@media (prefers-reduced-motion: reduce) {
  .btn { transition-duration: 1ms; }
}
```

### 3.3 Mobile-first e acessibilidade (zoom 200%)

- Base de fonte em `rem` (`html { font-size: 100% }` = 16px); todo espaçamento/tipografia em `rem`/`em`, nunca `px` fixo em componentes com texto.
- Layout fluido: grid/flex com `minmax()`/`wrap`; `max-width` em containers, nunca `width` fixa.
- **Nunca usar `user-scalable=no` ou `maximum-scale=1`** na viewport meta — bloquearia justamente o requisito de zoom 200%. Viewport deve ser só `width=device-width, initial-scale=1`.
- Alvos de toque ≥ 44px (2.75rem) em todos os botões/chips.
- Critério de aceite (Fase 4): testar reflow em 200% de zoom real do navegador em ao menos uma tela com formulário e uma com lista, sem scroll horizontal e sem sobreposição de texto.
- Checar contraste WCAG AA de `--text-faint` sobre os fundos — é o par mais arriscado da paleta original; se falhar em texto pequeno, reservar `--text-faint` para elementos grandes/decorativos e usar `--text-dim` para texto secundário legível.

### 3.4 Input monetário estilo Nubank

Estado interno é sempre um **inteiro `cents`** (nunca string livre nem float):
- Dígito digitado → `cents = min(cents * 10 + digito, CENTS_MAX)`
- Backspace → `cents = Math.floor(cents / 10)`
- Exibição: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)`, tipografia em `--font-mono`.
- `<input inputmode="numeric" pattern="[0-9]*">` para teclado numérico no mobile.
- **Ponto de atenção técnico (validar na Fase 1):** teclados virtuais mobile nem sempre disparam `onKeyDown` de forma confiável. Abordagem mais robusta: ouvir o evento `input` nativo e usar `nativeEvent.inputType` (`insertText`/`deleteContentBackward`) para inferir dígito adicionado/removido, tratando o campo sempre como "append/remove no final" independente de onde o usuário tocou. Se testes em iOS Safari/Android Chrome mostrarem inconsistência, ter como plano B um teclado numérico customizado na tela.

---

## 4. Componentes-chave

| Componente | Responsabilidade |
|---|---|
| `CurrencyInput` | Input monetário direita-para-esquerda (seção 3.4) |
| `PurchaseForm` | Descrição + `CurrencyInput` + data + seletor de tag (chips coloridos) — fluxo "+" → formulário → salvar em até 2 cliques a partir da tela inicial |
| `PurchaseList` + `MonthFilter` | Lista de compras do mês selecionado; troca de mês em 1 clique (chips ou dropdown) |
| `MonthTotalCard` | Soma de `amountCents` do mês filtrado, sempre visível no topo, sem ação do usuário |
| `TagManager` (CRUD) | Lista de tags com cor e orçamento; criar/editar com nome + swatch de cor (paleta derivada dos acentos do ZeroDelay: vermelho, azul `#4696ff`, violeta `#9a5cff`, magenta `#ec3fa0`, coral `#ff5a36`) + `monthlyBudget` via `CurrencyInput` |
| `BudgetIndicator` | Por tag, no mês filtrado: `gasto = soma das compras da tag`; `restante = monthlyBudget - gasto`; estados visuais: dentro do orçamento (`--success`), ≥80% (`--warning`), estourado (variante forte do acento) |
| `AccountScreen` | Hash mascarado + copiar, campo "entrar com outro hash", "sair" |
| `ThemeToggle` | Ciclo system/dark/light, 1 clique |

---

## 5. Fases de entrega

### Fase 0 — Setup & Infraestrutura
**Objetivo:** provar o round-trip completo (front → Function → Blob → front) antes de construir qualquer feature.
- Scaffold Vite + React + TS; `netlify.toml` com redirect `/api/*` → `/.netlify/functions/:splat`; Functions com esbuild.
- `shared/types.ts` compartilhado entre front e functions — validar que o build resolve o import (local via `netlify dev` e em deploy de preview real).
- Function de "ping" gravando/lendo no Blob, confirmando `getStore` com `consistency: "strong"`.
- Copiar os assets reais do ZeroDelay: `DepartureMono-Regular.woff2` + `OFL.txt` para `src/assets/fonts/`, montar `src/styles/fonts.css` com o `@font-face` local, e configurar Roboto via Google Fonts (seção 3.1.1).
- `.env.example`, scripts de dev (`netlify dev` emula Functions + Blobs localmente).
- **Pronto quando:** deploy de preview funcionando com tela mínima escrevendo e lendo do Blob via Function.

### Fase 1 — MVP de registro de gastos (histórias 1, 2, 3)
- Geração automática e silenciosa do hash no primeiro uso.
- `POST/PUT/DELETE /api/purchases` com read-modify-write + ETag em `_lib/blobStore.ts`.
- `PurchaseForm`, `PurchaseList`, `MonthFilter`, `MonthTotalCard`.
- **Pronto quando:** usuário registra compras, filtra por mês e vê o total, sem tags ainda.

### Fase 2 — Etiquetas e orçamento (histórias 4, 5, 8)
- `POST/PUT/DELETE /api/tags`; `TagManager` com seletor de cor; campo de orçamento na tag.
- Associar tag na `PurchaseForm` (chips coloridos); `BudgetIndicator` por tag no mês filtrado.
- **Pronto quando:** usuário cria etiquetas coloridas, define orçamento ideal, associa compras e vê visualmente quanto resta em cada categoria.

### Fase 3 — Conta e multi-dispositivo (história 7)
- Tela "Conta": hash mascarado, copiar, "entrar com hash existente", "sair".
- Tratamento de erro para hash inválido/inexistente.
- Avaliar "gerar novo hash preservando dados" (válvula de escape se o hash vazar).
- **Pronto quando:** um segundo dispositivo consegue "logar" com o hash gerado no primeiro e ver os mesmos dados; gasto registrado em um aparece no outro.

### Fase 4 — Tema, acessibilidade e polish mobile (história 6 + restrições)
- `ThemeProvider` + `ThemeToggle` completos (persistido por dispositivo).
- Auditoria de contraste, teste real de zoom 200% em ao menos 2 telas, teste de `prefers-reduced-motion`.
- Revisão de todos os fluxos para confirmar o limite de 2 cliques nas ações primárias.
- Teste em dispositivo real (iOS Safari + Android Chrome) do `CurrencyInput`.
- **Pronto quando:** checklist de acessibilidade (contraste, zoom, foco visível, touch targets, reduced-motion) todo verde.

### Fase 5 — Deploy e hardening
- Separação de ambientes preview/produção na store de Blobs (evitar que dados de preview se misturem com produção).
- Validação de payload nas Functions (tamanho de strings, limites de valor, formato do hash) — não há autenticação tradicional protegendo os endpoints.
- Estados de erro/loading/vazio em todas as telas.
- README com instruções de setup local (`netlify dev`) e deploy.
- **Pronto quando:** app publicado em produção, usado pela família, com tratamento de erro decente em falha de rede/API.

---

## 6. Riscos e decisões em aberto

Perguntas para revisitar com o usuário antes/durante as fases indicadas:

1. **Hash = identidade + credencial, sem segundo fator.** Quem tiver o hash tem acesso total e permanente. Proposta: botão "gerar novo hash e migrar dados" (Fase 3) como válvula de escape se o hash vazar.
2. **Perda do hash = perda permanente dos dados**, sem recuperação por e-mail. Perguntar ao usuário se aceita esse risco como está (mais simples, mais fiel ao "sem senha") ou se quer um backup opcional (ex.: "enviar meu hash por e-mail" como conveniência, não autenticação) — não implementar sem confirmação.
3. **Concorrência entre dispositivos** mitigada por ETag + retry, mas editar exatamente o mesmo item nos dois dispositivos ao mesmo tempo ainda é "last write wins" — aceitável para escala familiar, registrado como risco assumido.
4. **Consistência do Netlify Blobs:** validar na prática, na Fase 0, que `consistency: "strong"` realmente elimina leituras desatualizadas entre dispositivos.
5. **Limites do plano gratuito do Netlify Blobs** não são documentados publicamente em número fechado — checar na conta real antes da Fase 5.
6. **Sem autenticação tradicional** protegendo os endpoints (`POST /api/account` pode ser chamado à vontade, `GET /api/account` pode ser tentado com hashes ao acaso). Risco baixo por ser uso privado com URL não divulgada, mas recomenda-se validação básica de payload desde a Fase 5.
7. **Interpretação do limite "2 cliques por ação":** assumido como aplicável às ações primárias/frequentes (registrar compra, trocar mês, trocar tema), não a fluxos pontuais como CRUD completo de etiquetas. Confirmar com o usuário antes da Fase 2.

---

## 7. Caminho de evolução futura

(Requisito 29: login com senha, refresh token, apps nativos Android/iOS — fora de escopo agora, mas a arquitetura não deve travar essa evolução.)

- **Troca do hash-como-credencial por login real:** o header `X-Account-Hash` pode ser substituído por `Authorization: Bearer <access_token>` sem mudar a estrutura das Functions — a lógica de "resolver a chave da conta a partir de uma credencial" continua igual, só muda a forma da credencial. `hash.ts` pode evoluir para um módulo de auth mais completo sem reescrever `purchases.ts`/`tags.ts`.
- **`schemaVersion`** no blob já prevê migrações (ex.: multiusuário com permissões, orçamento por mês).
- **Camadas `api/`, `state/`, `features/`** no frontend isolam o mecanismo de autenticação em `src/api/client.ts` — trocar o mecanismo não afeta os componentes de feature.
- **Apps nativos:** a "API" já é HTTP/JSON simples; um app nativo futuro consumiria os mesmos endpoints sem mudança de contrato — a adaptação seria só de UI e de onde guardar a credencial (Keychain/Keystore em vez de `localStorage`).
- **Migração de Netlify Blobs para banco relacional**, se a escala crescer, fica isolada em `_lib/blobStore.ts` — troca a implementação interna sem mudar a interface usada pelas Functions de domínio.
