const formatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatCentsToBRL(cents: number): string {
  return formatter.format(cents / 100);
}
