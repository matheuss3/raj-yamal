import { getStore } from "@netlify/blobs";

// `process.env.CONTEXT` (production/deploy-preview/branch-deploy) só existe durante
// o build da Netlify — não fica disponível em Functions no runtime (só URL, SITE_NAME
// e SITE_ID são garantidos ali). Por isso o isolamento entre produção e preview é feito
// via uma env var própria, configurável com valor diferente por contexto de deploy nas
// configurações do site (ver README, seção "Deploy"). Sem configurar nada, tudo cai na
// mesma store "accounts" — o comportamento padrão de antes desta mudança.
const STORE_SUFFIX = process.env.BLOBS_STORE_SUFFIX ?? "";
const ACCOUNTS_STORE = `accounts${STORE_SUFFIX}`;

/**
 * Store site-scoped (padrão do Netlify Blobs): persiste entre deploys.
 * consistency: "strong" evita leituras desatualizadas entre dispositivos
 * (o padrão do Netlify Blobs é consistência eventual, com até 60s de propagação).
 */
export function accountsStore() {
  return getStore({ name: ACCOUNTS_STORE, consistency: "strong" });
}

export interface BlobRecord<T> {
  data: T;
  etag: string;
}

export async function getAccount<T>(key: string): Promise<BlobRecord<T> | null> {
  const store = accountsStore();
  const result = await store.getWithMetadata(key, { type: "json" });
  if (!result) return null;
  return { data: result.data as T, etag: result.etag };
}

/**
 * Read-modify-write com concorrência otimista via ETag.
 * Se o blob mudar entre o read e o write, tenta de novo com o etag mais recente.
 */
export async function updateAccount<T>(
  key: string,
  update: (current: T | null) => T,
  { maxRetries = 3 }: { maxRetries?: number } = {},
): Promise<T> {
  const store = accountsStore();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const current = await getAccount<T>(key);
    const next = update(current?.data ?? null);

    const { modified } = await store.set(key, JSON.stringify(next), {
      onlyIfMatch: current?.etag,
    });

    if (modified) return next;
  }

  throw new Error(`updateAccount: falha ao gravar "${key}" após ${maxRetries} tentativas (conflito de concorrência)`);
}

export async function deleteAccount(key: string): Promise<void> {
  await accountsStore().delete(key);
}
