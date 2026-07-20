import { formatMonthLabel } from "../../utils/date";

interface MonthFilterProps {
  months: string[];
  selected: string;
  onSelect: (month: string) => void;
}

export function MonthFilter({ months, selected, onSelect }: MonthFilterProps) {
  return (
    <div
      role="group"
      aria-label="Filtrar por mês"
      style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem", minWidth: 0 }}
    >
      {months.map((month) => {
        const isSelected = month === selected;
        return (
          <button
            key={month}
            type="button"
            className="btn"
            aria-pressed={isSelected}
            onClick={() => onSelect(month)}
            style={{
              flexShrink: 0,
              background: isSelected ? "var(--accent)" : undefined,
              color: isSelected ? "#ffffff" : undefined,
            }}
          >
            {formatMonthLabel(month)}
          </button>
        );
      })}
    </div>
  );
}
