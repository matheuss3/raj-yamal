import type { Purchase } from "../../shared/types";

/** Data de hoje no formato YYYY-MM-DD (fuso local). */
export function todayISODate(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

/** Chave de mês (YYYY-MM) do mês atual. */
export function currentMonthKey(): string {
  return todayISODate().slice(0, 7);
}

/** Extrai a chave de mês (YYYY-MM) de uma data YYYY-MM-DD. */
export function monthKeyFromDate(date: string): string {
  return date.slice(0, 7);
}

/** Formata uma chave de mês (YYYY-MM) como "07/2026". */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `${month}/${year}`;
}

/** Formata uma data YYYY-MM-DD como "20/07" — compacta para caber ao lado da descrição no card. */
export function formatDateShort(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

/** Formata uma data YYYY-MM-DD como "20/07/2026". */
export function formatDateFull(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

/** Lista as chaves de mês presentes nas compras, mais recentes primeiro, garantindo que `mustInclude` apareça. */
export function listAvailableMonths(purchases: Purchase[], mustInclude?: string): string[] {
  const months = new Set(purchases.map((p) => monthKeyFromDate(p.date)));
  if (mustInclude) months.add(mustInclude);
  return [...months].sort().reverse();
}
