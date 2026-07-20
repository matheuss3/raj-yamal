import { useEffect } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "1rem",
        // rola o overlay inteiro (não o conteúdo do dialog) — com o modal
        // colado no topo, o teclado virtual encolhe a viewport visual e o
        // navegador rola o campo focado até ela, em vez de esconder os
        // campos de baixo atrás do teclado (problema com alignItems: center).
        overflowY: "auto",
        zIndex: 100,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-0)",
          borderRadius: "var(--radius)",
          padding: "1.25rem",
          width: "100%",
          maxWidth: "32rem",
          marginTop: "max(1rem, env(safe-area-inset-top))",
          marginBottom: "1rem",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxShadow: "3px 3px 0 0 #000",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{title}</h2>
          <button type="button" className="btn" onClick={onClose} aria-label="Fechar">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
