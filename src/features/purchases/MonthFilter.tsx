import { Select } from "../../components/Select";
import { formatMonthLabel } from "../../utils/date";

interface MonthFilterProps {
  months: string[];
  selected: string;
  onSelect: (month: string) => void;
}

export function MonthFilter({ months, selected, onSelect }: MonthFilterProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <span id="month-filter-label">Mês</span>
      <Select
        ariaLabelledBy="month-filter-label"
        value={selected}
        onChange={onSelect}
        options={months.map((month) => ({ value: month, label: formatMonthLabel(month) }))}
      />
    </div>
  );
}
