import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { getActionLog, logAction, type ActionLogEntry } from "../../utils/actionLog";

const logTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

/** Ícone por tipo de ação, a partir do prefixo da mensagem registrada em logAction(). */
function actionIcon(message: string): string {
  if (message.startsWith("Gasto adicionado")) return "add_circle";
  if (message.startsWith("Gasto excluído")) return "delete";
  if (message.startsWith("Etiqueta do gasto")) return "sell";
  if (message.startsWith("Etiqueta criada")) return "new_label";
  if (message.startsWith("Etiqueta arquivada")) return "archive";
  if (message.startsWith("Etiqueta desarquivada")) return "unarchive";
  if (message.startsWith("Trocou de conta")) return "swap_horiz";
  if (message.startsWith("Gerou novo código")) return "vpn_key";
  if (message.startsWith("Saiu deste dispositivo")) return "logout";
  return "history";
}

interface AccountScreenProps {
  accountHash: string;
  onSwitchAccount: (hash: string) => Promise<void>;
  onRotateHash: () => Promise<string>;
  onSignOut: () => void;
}

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-1)",
  color: "var(--text-primary)",
  border: "none",
  borderRadius: "var(--radius-sm)",
  padding: "0.75rem 1rem",
};

export function AccountScreen({ accountHash, onSwitchAccount, onRotateHash, onSignOut }: AccountScreenProps) {
  const [revealed, setRevealed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string>();

  const [otherHash, setOtherHash] = useState("");
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string>();

  const [rotating, setRotating] = useState(false);
  const [rotateError, setRotateError] = useState<string>();
  const [justRotated, setJustRotated] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [actionLog, setActionLog] = useState<ActionLogEntry[]>(getActionLog);

  function recordAction(message: string) {
    logAction(message);
    setActionLog(getActionLog());
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(accountHash);
      setCopyFeedback("Copiado!");
    } catch {
      setCopyFeedback("Não copiou — selecione manualmente.");
    }
    setTimeout(() => setCopyFeedback(undefined), 2000);
  }

  async function handleSwitch(e: React.FormEvent) {
    e.preventDefault();
    if (!otherHash.trim()) return;

    setSwitching(true);
    setSwitchError(undefined);
    try {
      await onSwitchAccount(otherHash);
      setOtherHash("");
      recordAction("Trocou de conta");
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : String(err));
    } finally {
      setSwitching(false);
    }
  }

  async function confirmRotate() {
    setShowRotateConfirm(false);
    setRotating(true);
    setRotateError(undefined);
    try {
      await onRotateHash();
      setJustRotated(true);
      setRevealed(true);
      recordAction("Gerou novo código de acesso");
    } catch (err) {
      setRotateError(err instanceof Error ? err.message : String(err));
    } finally {
      setRotating(false);
    }
  }

  function confirmSignOut() {
    setShowSignOutConfirm(false);
    logAction("Saiu deste dispositivo");
    onSignOut();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Seu código de acesso</h2>
        <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", margin: 0 }}>
          Use este código para acessar os mesmos dados em outro dispositivo. Guarde-o em lugar seguro — quem tiver o
          código tem acesso aos seus dados.
        </p>

        {justRotated && (
          <p style={{ color: "var(--success)", fontSize: "0.85rem", margin: 0 }}>
            Novo código gerado. O código anterior não funciona mais.
          </p>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <input
              type={revealed ? "text" : "password"}
              value={accountHash}
              readOnly
              aria-label="Seu código de acesso"
              style={{
                ...fieldStyle,
                width: "100%",
                fontFamily: "var(--font-mono)",
                fontSize: "1.1rem",
                paddingRight: "3.25rem",
              }}
            />
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? "Ocultar código" : "Mostrar código"}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "1.1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={revealed ? "visibility_off" : "visibility"} />
            </button>
          </div>

          <button
            type="button"
            className="btn"
            onClick={handleCopy}
            style={{ flexShrink: 0, color: copyFeedback === "Copiado!" ? "var(--success)" : undefined }}
          >
            {copyFeedback ?? "Copiar"}
          </button>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Entrar com outro código</h2>
        <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", margin: 0 }}>
          Já tem um código de outro dispositivo? Cole abaixo para acessar aqueles dados aqui.
        </p>
        <form onSubmit={handleSwitch} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={otherHash}
            onChange={(e) => setOtherHash(e.target.value)}
            placeholder="xxxx-xxxx-xxxx-xxxx"
            style={{ ...fieldStyle, flex: 1, minWidth: 0, fontFamily: "var(--font-mono)" }}
          />
          <button type="submit" className="btn btn--accent" disabled={switching || !otherHash.trim()}>
            {switching ? "Entrando…" : "Entrar"}
          </button>
        </form>
        {switchError && <p style={{ color: "var(--accent-strong)" }}>{switchError}</p>}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Segurança</h2>
        <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", margin: 0 }}>
          Se você acha que alguém mais teve acesso ao seu código, gere um novo. Seus dados são preservados, mas o
          código antigo para de funcionar.
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => setShowRotateConfirm(true)}
          disabled={rotating}
          style={{ alignSelf: "flex-start" }}
        >
          {rotating ? "Gerando…" : "Gerar novo código"}
        </button>
        {rotateError && <p style={{ color: "var(--accent-strong)" }}>{rotateError}</p>}
      </section>

      <section>
        <button type="button" className="btn" onClick={() => setShowSignOutConfirm(true)}>
          Sair deste dispositivo
        </button>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Histórico local de ações</h2>
        <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", margin: 0 }}>
          Registrado só neste dispositivo (localStorage) — não é sincronizado com o servidor.
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setActionLog(getActionLog());
            setShowHistory(true);
          }}
          style={{ alignSelf: "flex-start" }}
        >
          <Icon name="history" size={18} />
          Ver histórico
        </button>
      </section>

      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Histórico local de ações">
        {actionLog.length === 0 ? (
          <p style={{ color: "var(--text-dim)" }}>Nenhuma ação registrada ainda.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {actionLog.map((entry, index) => (
              <li
                key={`${entry.at}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  background: "var(--bg-1)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.6rem 0.85rem",
                  fontSize: "0.85rem",
                }}
              >
                <Icon name={actionIcon(entry.message)} size={20} style={{ color: "var(--text-dim)", flexShrink: 0 }} />
                <span style={{ minWidth: 0, overflowWrap: "break-word", flex: 1 }}>{entry.message}</span>
                <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", flexShrink: 0 }}>
                  {logTimeFormatter.format(new Date(entry.at))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={showRotateConfirm}
        title="Gerar novo código?"
        message="O código atual deixa de funcionar imediatamente. Seus dados são preservados — copie o novo código antes de sair desta tela."
        confirmLabel="Gerar novo código"
        danger
        onConfirm={confirmRotate}
        onCancel={() => setShowRotateConfirm(false)}
      />

      <ConfirmDialog
        open={showSignOutConfirm}
        title="Sair deste dispositivo?"
        message="Seus dados continuam salvos, mas guarde o código de acesso antes — sem ele você não recupera esta conta."
        confirmLabel="Sair"
        danger
        onConfirm={confirmSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </div>
  );
}
