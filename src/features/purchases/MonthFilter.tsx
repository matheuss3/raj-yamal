import { formatMonthLabel } from "../../utils/date";

interface MonthFilterProps {
  months: string[];
  selected: string;
  onSelect: (month: string) => void;
}

export function MonthFilter({ months, selected, onSelect }: MonthFilterProps) {
  return (
    <label htmlFor="month-filter" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Mês
      <select
        id="month-filter"
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        style={{
          background: "var(--bg-1)",
          color: "var(--text-primary)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          padding: "0.75rem 1rem",
        }}
      >
        {months.map((month) => (
          <option key={month} value={month}>
            {formatMonthLabel(month)}
          </option>
        ))}
      </select>
    </label>
  );
}
