import { useState } from "react";
import type { CSSProperties } from "react";
import type { NewPurchaseInput, Tag } from "../../../shared/types";
import { CurrencyInput } from "../../components/money/CurrencyInput";
import { Icon } from "../../components/Icon";
import { Select } from "../../components/Select";
import { formatCentsToBRL } from "../../utils/currency";
import { formatDateFull, todayISODate } from "../../utils/date";

interface PurchaseFormProps {
  tags: Tag[];
  onSubmit: (input: NewPurchaseInput) => Promise<unknown>;
}

/** Sentinela pro Select — Radix não aceita value="" em item. */
const NO_TAG = "__none__";

type Step = "description" | "amount" | "tag" | "date" | "confirm";

const fieldStyle: CSSProperties = {
  background: "var(--bg-1)",
  color: "var(--text-primary)",
  border: "none",
  borderRadius: "var(--radius-sm)",
  padding: "0.75rem 1rem",
};

/**
 * Lançamento de gasto em etapas (uma pergunta por tela, tipo confirmação de
 * Pix no app do banco) em vez de um formulário só — evita que o teclado
 * virtual, aberto no campo de descrição, cubra o campo de valor logo abaixo.
 */
export function PurchaseForm({ tags, onSubmit }: PurchaseFormProps) {
  const activeTags = tags.filter((tag) => !tag.archived);
  const steps: Step[] =
    activeTags.length > 0 ? ["description", "amount", "tag", "date", "confirm"] : ["description", "amount", "date", "confirm"];

  const [stepIndex, setStepIndex] = useState(0);
  const [description, setDescription] = useState("");
  const [amountCents, setAmountCents] = useState(0);
  const [date, setDate] = useState(todayISODate());
  const [tagId, setTagId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const selectedTag = tagId ? activeTags.find((tag) => tag.id === tagId) : undefined;

  function stepIsValid(s: Step): boolean {
    if (s === "description") return description.trim().length > 0;
    if (s === "amount") return amountCents > 0;
    if (s === "date") return date.trim().length > 0;
    return true;
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(undefined);
    try {
      await onSubmit({ description: description.trim(), amountCents, date, tagId });
      setDescription("");
      setAmountCents(0);
      setDate(todayISODate());
      setTagId(null);
      setStepIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stepIsValid(step)) return;
    if (isLast) {
      void handleConfirm();
    } else {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    }
  }

  return (
    <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-label={`Passo ${stepIndex + 1} de ${steps.length}`}
        style={{ display: "flex", gap: "0.35rem" }}
      >
        {steps.map((s, i) => (
          <span
            key={s}
            aria-hidden="true"
            style={{
              flex: 1,
              height: "0.3rem",
              borderRadius: "999px",
              background: i <= stepIndex ? "var(--accent)" : "var(--bg-2)",
              transition: "background-color var(--transition-color) var(--ease-standard)",
            }}
          />
        ))}
      </div>

      {step === "description" && (
        <label htmlFor="purchase-description" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          No que você gastou?
          <input
            id="purchase-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={140}
            autoFocus
            required
            style={fieldStyle}
          />
        </label>
      )}

      {step === "amount" && <CurrencyInput id="purchase-amount" label="Quanto foi?" value={amountCents} onChange={setAmountCents} autoFocus />}

      {step === "tag" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <span id="purchase-tag-label">Alguma etiqueta?</span>
          <Select
            ariaLabelledBy="purchase-tag-label"
            value={tagId ?? NO_TAG}
            onChange={(value) => setTagId(value === NO_TAG ? null : value)}
            options={[{ value: NO_TAG, label: "Sem etiqueta" }, ...activeTags.map((tag) => ({ value: tag.id, label: tag.name }))]}
          />
        </div>
      )}

      {step === "date" && (
        <label htmlFor="purchase-date" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          Quando foi?
          <input
            id="purchase-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            autoFocus
            style={fieldStyle}
          />
        </label>
      )}

      {step === "confirm" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>Confira antes de lançar</span>
          <div
            style={{
              background: "var(--bg-1)",
              borderRadius: "var(--radius-sm)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            <SummaryRow label="Descrição" value={description} />
            <SummaryRow label="Valor" value={formatCentsToBRL(amountCents)} mono />
            {selectedTag && <SummaryRow label="Etiqueta" value={selectedTag.name} />}
            <SummaryRow label="Data" value={formatDateFull(date)} />
          </div>
        </div>
      )}

      {error && <p style={{ color: "var(--accent-strong)" }}>{error}</p>}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        {!isFirst && (
          <button type="button" className="btn" onClick={goBack} disabled={submitting} style={{ flex: 1 }}>
            <Icon name="arrow_back" size={18} />
            Voltar
          </button>
        )}
        <button type="submit" className="btn btn--accent" disabled={!stepIsValid(step) || submitting} style={{ flex: 1 }}>
          {isLast ? (
            submitting ? "Confirmando…" : "Confirmar"
          ) : (
            <>
              Avançar
              <Icon name="arrow_forward" size={18} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      <span style={{ fontFamily: mono ? "var(--font-mono)" : undefined, textAlign: "right", overflowWrap: "break-word", minWidth: 0 }}>
        {value}
      </span>
    </div>
  );
}
