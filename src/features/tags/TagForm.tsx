import { useState } from "react";
import type { NewTagInput } from "../../../shared/types";
import { CurrencyInput } from "../../components/money/CurrencyInput";
import { TAG_COLOR_PALETTE } from "./tagColors";

interface TagFormProps {
  onSubmit: (input: NewTagInput) => Promise<unknown>;
}

export function TagForm({ onSubmit }: TagFormProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(TAG_COLOR_PALETTE[0]);
  const [budgetCents, setBudgetCents] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const canSubmit = name.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(undefined);
    try {
      await onSubmit({ name: name.trim(), color, monthlyBudget: budgetCents > 0 ? budgetCents : null });
      setName("");
      setColor(TAG_COLOR_PALETTE[0]);
      setBudgetCents(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <label htmlFor="tag-name" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Nome da etiqueta
        <input
          id="tag-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          required
          style={{
            background: "var(--bg-1)",
            color: "var(--text-primary)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "0.75rem 1rem",
          }}
        />
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>Cor</span>
        <div role="group" aria-label="Cor da etiqueta" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {TAG_COLOR_PALETTE.map((paletteColor) => (
            <button
              key={paletteColor}
              type="button"
              aria-label={`Selecionar cor ${paletteColor}`}
              aria-pressed={color === paletteColor}
              onClick={() => setColor(paletteColor)}
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "999px",
                background: paletteColor,
                border: color === paletteColor ? "3px solid var(--text-primary)" : "3px solid transparent",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      <CurrencyInput
        id="tag-budget"
        label="Orçamento ideal por mês (opcional)"
        value={budgetCents}
        onChange={setBudgetCents}
      />

      {error && <p style={{ color: "var(--accent-strong)" }}>{error}</p>}

      <button type="submit" className="btn btn--accent" disabled={!canSubmit}>
        {submitting ? "Salvando…" : "Criar etiqueta"}
      </button>
    </form>
  );
}
