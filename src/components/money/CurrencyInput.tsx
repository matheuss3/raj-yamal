import type { KeyboardEvent } from "react";
import { formatCentsToBRL } from "../../utils/currency";

const MAX_CENTS = 999_999_999;

interface CurrencyInputProps {
  id?: string;
  label?: string;
  value: number;
  /** Recebe um updater (prevCents) => nextCents, como o setState do React, para não perder dígitos em digitação rápida. */
  onChange: (updater: (prevCents: number) => number) => void;
  autoFocus?: boolean;
}

/**
 * Input monetário estilo apps bancários (Nubank): os dígitos entram sempre
 * pela direita, empurrando as casas decimais/unidades/dezenas, nunca por
 * edição livre de texto.
 *
 * As mutações são sempre expressas como updater (prev => next), nunca lendo
 * `value` diretamente: em digitação rápida, vários keydown/input disparam
 * antes do React re-renderizar, e um handler que fecha sobre `value` do
 * último render perderia ou corromperia dígitos.
 */
export function CurrencyInput({ id, label, value, onChange, autoFocus }: CurrencyInputProps) {
  function appendDigit(digit: number) {
    onChange((prev) => Math.min(prev * 10 + digit, MAX_CENTS));
  }

  function removeLastDigit() {
    onChange((prev) => Math.floor(prev / 10));
  }

  // Teclado físico: intercepta a tecla antes de qualquer inserção nativa no
  // input, evitando edição de texto livre.
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      appendDigit(Number(e.key));
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      removeLastDigit();
    } else if (e.key !== "Tab" && e.key !== "Enter" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
    }
  }

  // Teclados virtuais mobile nem sempre disparam keydown de forma confiável;
  // como fallback, interpreta o evento "input" nativo via inputType.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nativeEvent = e.nativeEvent as InputEvent;
    if (nativeEvent.inputType === "insertText" || nativeEvent.inputType === "insertFromPaste") {
      const digits = (nativeEvent.data ?? "").replace(/\D/g, "");
      for (const digit of digits) appendDigit(Number(digit));
    } else if (
      nativeEvent.inputType === "deleteContentBackward" ||
      nativeEvent.inputType === "deleteContentForward"
    ) {
      removeLastDigit();
    }
  }

  return (
    <label htmlFor={id} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {label}
      <input
        id={id}
        inputMode="numeric"
        autoFocus={autoFocus}
        value={formatCentsToBRL(value)}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        style={{
          fontSize: "1.25rem",
          textAlign: "right",
          background: "var(--bg-1)",
          color: "var(--text-primary)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          padding: "0.75rem 1rem",
          width: "100%",
        }}
      />
    </label>
  );
}
