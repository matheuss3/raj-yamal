import type { Tag } from "../../../shared/types";
import { formatCentsToBRL } from "../../utils/currency";

interface BudgetIndicatorProps {
  tag: Tag;
  spentCents: number;
}

/** Só faz sentido mostrar quando a etiqueta tem orçamento definido (monthlyBudget != null). */
export function BudgetIndicator({ tag, spentCents }: BudgetIndicatorProps) {
  if (tag.monthlyBudget == null) return null;

  const ratio = spentCents / tag.monthlyBudget;
  const remainingCents = tag.monthlyBudget - spentCents;
  const isOver = remainingCents < 0;
  const isNearLimit = !isOver && ratio >= 0.8;
  const stateColor = isOver ? "var(--accent-strong)" : isNearLimit ? "var(--warning)" : "var(--success)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        background: "var(--bg-1)",
        borderRadius: "var(--radius-sm)",
        padding: "0.75rem 1rem",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.25rem 0.5rem" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0, overflowWrap: "break-word" }}>
          <span
            aria-hidden="true"
            style={{ width: "0.7rem", height: "0.7rem", borderRadius: "999px", background: tag.color, display: "inline-block" }}
          />
          {tag.name}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", minWidth: 0, overflowWrap: "break-word" }}>
          {formatCentsToBRL(spentCents)} / {formatCentsToBRL(tag.monthlyBudget)}
        </span>
      </div>

      <div style={{ height: "0.4rem", borderRadius: "999px", background: "var(--bg-2)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${Math.min(ratio, 1) * 100}%`,
            background: stateColor,
            transition: "width var(--transition-color) var(--ease-standard)",
          }}
        />
      </div>

      <span style={{ fontSize: "0.75rem", color: stateColor }}>
        {isOver ? `Estourou em ${formatCentsToBRL(Math.abs(remainingCents))}` : `Restam ${formatCentsToBRL(remainingCents)}`}
      </span>
    </div>
  );
}
