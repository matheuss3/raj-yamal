import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./Icon";

interface AsyncButtonProps {
  onClick: () => Promise<unknown>;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  disabled?: boolean;
  iconSize?: number;
}

/** Botão que trava contra re-clique enquanto `onClick` está em andamento, trocando o
 * conteúdo por um ícone girando — usado em toda ação assíncrona disparada por clique. */
export function AsyncButton({
  onClick,
  children,
  className = "btn",
  style,
  ariaLabel,
  disabled,
  iconSize = 18,
}: AsyncButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      await onClick();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={disabled || pending}
      aria-label={ariaLabel}
      aria-busy={pending}
      style={style}
    >
      {pending ? <Icon name="autorenew" size={iconSize} spin /> : children}
    </button>
  );
}
