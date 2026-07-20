import type { AccountData } from "../../shared/types";
import { apiFetch } from "./client";

export function createAccount() {
  return apiFetch<{ hash: string; data: AccountData }>("/api/account", { method: "POST" });
}

export function fetchAccount() {
  return apiFetch<{ data: AccountData }>("/api/account");
}

/** Busca uma conta por um hash explícito, sem depender do localStorage — usado para
 * validar o hash de outro dispositivo antes de trocar de conta neste. */
export function fetchAccountByHash(hash: string) {
  return apiFetch<{ data: AccountData }>("/api/account", { headers: { "X-Account-Hash": hash } });
}

/** Gera um novo hash para a conta atual, migrando todos os dados. O hash antigo passa a ser inválido. */
export function rotateAccountHash() {
  return apiFetch<{ hash: string; data: AccountData }>("/api/account", { method: "PATCH" });
}
