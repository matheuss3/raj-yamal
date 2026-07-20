export const ACCOUNT_HASH_STORAGE_KEY = "raj-yamal:accountHash";

/**
 * Wrapper fino sobre fetch para chamadas à API (/api/*, redirecionado para Netlify Functions).
 * Injeta automaticamente o header X-Account-Hash a partir do localStorage, quando presente —
 * a menos que a chamada já tenha passado um X-Account-Hash explícito (usado ao validar um
 * hash de outro dispositivo antes de persisti-lo no localStorage local).
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (!headers.has("X-Account-Hash")) {
    const hash = localStorage.getItem(ACCOUNT_HASH_STORAGE_KEY);
    if (hash) headers.set("X-Account-Hash", hash);
  }
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const res = await fetch(path, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Erro ${res.status} ao chamar ${path}`);
  }

  return res.json() as Promise<T>;
}
