import type { Purchase } from "../../shared/types";

const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

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

/** Formata uma chave de mês (YYYY-MM) como "Julho de 2026". */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const label = monthLabelFormatter.format(new Date(year, month - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Lista as chaves de mês presentes nas compras, mais recentes primeiro, garantindo que `mustInclude` apareça. */
export function listAvailableMonths(purchases: Purchase[], mustInclude?: string): string[] {
  const months = new Set(purchases.map((p) => monthKeyFromDate(p.date)));
  if (mustInclude) months.add(mustInclude);
  return [...months].sort().reverse();
}
