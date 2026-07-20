import { useState } from "react";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (pending) return;
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open={open} onClose={pending ? () => {} : onCancel} title={title}>
      <p style={{ margin: 0, color: "var(--text-dim)" }}>{message}</p>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className="btn btn--accent"
          onClick={handleConfirm}
          disabled={pending}
          aria-busy={pending}
          style={danger ? { background: "var(--accent-strong)" } : undefined}
        >
          {pending ? <Icon name="autorenew" size={18} spin /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
