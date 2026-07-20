import { useState } from "react";
import type { NewPurchaseInput, Tag } from "../../../shared/types";
import { CurrencyInput } from "../../components/money/CurrencyInput";
import { todayISODate } from "../../utils/date";

interface PurchaseFormProps {
  tags: Tag[];
  onSubmit: (input: NewPurchaseInput) => Promise<unknown>;
}

export function PurchaseForm({ tags, onSubmit }: PurchaseFormProps) {
  const [description, setDescription] = useState("");
  const [amountCents, setAmountCents] = useState(0);
  const [date, setDate] = useState(todayISODate());
  const [tagId, setTagId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const activeTags = tags.filter((tag) => !tag.archived);
  const canSubmit = description.trim().length > 0 && amountCents > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(undefined);
    try {
      await onSubmit({ description: description.trim(), amountCents, date, tagId });
      setDescription("");
      setAmountCents(0);
      setDate(todayISODate());
      setTagId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <label htmlFor="purchase-description" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Descrição
        <input
          id="purchase-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={140}
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

      <CurrencyInput id="purchase-amount" label="Valor" value={amountCents} onChange={setAmountCents} />

      <label htmlFor="purchase-date" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Data
        <input
          id="purchase-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
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

      {activeTags.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>Etiqueta</span>
          <div role="group" aria-label="Etiqueta da compra" style={{ display: "flex", gap: "0.5rem", overflowX: "auto", minWidth: 0 }}>
            <button
              type="button"
              className="btn"
              aria-pressed={tagId === null}
              onClick={() => setTagId(null)}
              style={{
                flexShrink: 0,
                background: tagId === null ? "var(--bg-2)" : undefined,
                border: tagId === null ? "2px solid var(--text-dim)" : undefined,
              }}
            >
              Sem etiqueta
            </button>
            {activeTags.map((tag) => {
              const isSelected = tag.id === tagId;
              return (
                <button
                  key={tag.id}
                  type="button"
                  className="btn"
                  aria-pressed={isSelected}
                  onClick={() => setTagId(tag.id)}
                  style={{
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: isSelected ? "var(--bg-2)" : undefined,
                    border: isSelected ? `2px solid ${tag.color}` : undefined,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ width: "0.65rem", height: "0.65rem", borderRadius: "999px", background: tag.color, display: "inline-block" }}
                  />
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p style={{ color: "var(--accent-strong)" }}>{error}</p>}

      <button type="submit" className="btn btn--accent" disabled={!canSubmit}>
        {submitting ? "Salvando…" : "Salvar gasto"}
      </button>
    </form>
  );
}
