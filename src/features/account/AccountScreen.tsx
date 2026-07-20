import { useState } from "react";

interface AccountScreenProps {
  accountHash: string;
  onSwitchAccount: (hash: string) => Promise<void>;
  onRotateHash: () => Promise<string>;
  onSignOut: () => void;
}

function maskHash(hash: string): string {
  return hash.replace(/[^-]/g, "•");
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
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : String(err));
    } finally {
      setSwitching(false);
    }
  }

  async function handleRotate() {
    const confirmed = window.confirm(
      "Gerar um novo código de acesso? O código atual deixa de funcionar imediatamente. Seus dados são preservados — copie o novo código antes de sair desta tela.",
    );
    if (!confirmed) return;

    setRotating(true);
    setRotateError(undefined);
    try {
      await onRotateHash();
      setJustRotated(true);
      setRevealed(true);
    } catch (err) {
      setRotateError(err instanceof Error ? err.message : String(err));
    } finally {
      setRotating(false);
    }
  }

  function handleSignOut() {
    const confirmed = window.confirm(
      "Sair deste dispositivo? Seus dados continuam salvos, mas guarde o código de acesso antes — sem ele você não recupera esta conta.",
    );
    if (confirmed) onSignOut();
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--bg-1)",
            borderRadius: "var(--radius-sm)",
            padding: "0.75rem 1rem",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", wordBreak: "break-all" }}>
            {revealed ? accountHash : maskHash(accountHash)}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={() => setRevealed((r) => !r)}>
            {revealed ? "Ocultar" : "Mostrar"}
          </button>
          <button type="button" className="btn" onClick={handleCopy}>
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
        <button type="button" className="btn" onClick={handleRotate} disabled={rotating} style={{ alignSelf: "flex-start" }}>
          {rotating ? "Gerando…" : "Gerar novo código"}
        </button>
        {rotateError && <p style={{ color: "var(--accent-strong)" }}>{rotateError}</p>}
      </section>

      <section>
        <button type="button" className="btn" onClick={handleSignOut}>
          Sair deste dispositivo
        </button>
      </section>
    </div>
  );
}
