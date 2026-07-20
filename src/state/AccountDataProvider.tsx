import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AccountData, NewPurchaseInput, NewTagInput } from "../../shared/types";
import { createAccount, fetchAccount, fetchAccountByHash, rotateAccountHash } from "../api/account";
import { ACCOUNT_HASH_STORAGE_KEY } from "../api/client";
import { createPurchase, deletePurchase } from "../api/purchases";
import { archiveTag, createTag } from "../api/tags";

type AccountStatus = "loading" | "ready" | "error";

interface AccountContextValue {
  status: AccountStatus;
  error?: string;
  data: AccountData | null;
  addPurchase: (input: NewPurchaseInput) => Promise<void>;
  removePurchase: (id: string) => Promise<void>;
  addTag: (input: NewTagInput) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  /** Troca para uma conta existente a partir de um hash de outro dispositivo. */
  switchAccount: (hash: string) => Promise<void>;
  /** Gera um novo hash para a conta atual, migrando os dados; retorna o novo hash. */
  rotateHash: () => Promise<string>;
  /** Limpa a conta deste dispositivo (não afeta os dados salvos no servidor). */
  signOut: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AccountStatus>("loading");
  const [error, setError] = useState<string>();
  const [data, setData] = useState<AccountData | null>(null);

  // Evita disparar o boot duas vezes: o double-invoke de efeitos do StrictMode
  // (dev) rodaria POST /api/account duas vezes em paralelo e criaria duas
  // contas, deixando localStorage e o estado em memória referenciando contas
  // diferentes. `hasBooted` garante que a criação/leitura da conta rode uma
  // única vez por carregamento real da página.
  const hasBooted = useRef(false);

  useEffect(() => {
    if (hasBooted.current) return;
    hasBooted.current = true;

    async function boot() {
      try {
        const existingHash = localStorage.getItem(ACCOUNT_HASH_STORAGE_KEY);
        let accountData: AccountData;

        if (existingHash) {
          accountData = (await fetchAccount()).data;
        } else {
          const created = await createAccount();
          localStorage.setItem(ACCOUNT_HASH_STORAGE_KEY, created.hash);
          accountData = created.data;
        }

        setData(accountData);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    }

    boot();
  }, []);

  const addPurchase = useCallback(async (input: NewPurchaseInput) => {
    const result = await createPurchase(input);
    setData(result.data);
  }, []);

  const removePurchase = useCallback(async (id: string) => {
    const result = await deletePurchase(id);
    setData(result.data);
  }, []);

  const addTag = useCallback(async (input: NewTagInput) => {
    const result = await createTag(input);
    setData(result.data);
  }, []);

  const removeTag = useCallback(async (id: string) => {
    const result = await archiveTag(id);
    setData(result.data);
  }, []);

  const switchAccount = useCallback(async (hash: string) => {
    const normalized = hash.trim();
    const result = await fetchAccountByHash(normalized);
    localStorage.setItem(ACCOUNT_HASH_STORAGE_KEY, normalized);
    setData(result.data);
  }, []);

  const rotateHash = useCallback(async () => {
    const result = await rotateAccountHash();
    localStorage.setItem(ACCOUNT_HASH_STORAGE_KEY, result.hash);
    setData(result.data);
    return result.hash;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(ACCOUNT_HASH_STORAGE_KEY);
    window.location.reload();
  }, []);

  return (
    <AccountContext.Provider
      value={{ status, error, data, addPurchase, removePurchase, addTag, removeTag, switchAccount, rotateHash, signOut }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountData(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccountData deve ser usado dentro de <AccountDataProvider>");
  return ctx;
}
