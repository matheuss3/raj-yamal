import { formatCentsToBRL } from "../../utils/currency";

export function MonthTotalCard({ totalCents }: { totalCents: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        background: "var(--bg-1)",
        borderRadius: "var(--radius)",
        padding: "1rem",
      }}
    >
      <span style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>Total do mês</span>
      <strong style={{ fontSize: "1.75rem" }}>
        {formatCentsToBRL(totalCents)}
      </strong>
    </div>
  );
}
