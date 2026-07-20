import type { Tag } from "../../../shared/types";

interface TagPickerProps {
  /** Já deve vir filtrada (sem tags arquivadas) — o caller decide o que exibir. */
  tags: Tag[];
  selectedTagId: string | null;
  onSelect: (tagId: string | null) => void;
  ariaLabel?: string;
}

export function TagPicker({ tags, selectedTagId, onSelect, ariaLabel = "Etiqueta" }: TagPickerProps) {
  return (
    // overflow-x: auto força overflow-y a "auto" também, o que corta o box-shadow
    // (3px 3px) do .btn na borda inferior/direita — a margem negativa compensa o
    // padding extra pra não deslocar o layout ao redor.
    <div
      role="group"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        minWidth: 0,
        padding: "0 0.25rem 0.25rem 0",
        margin: "0 -0.25rem -0.25rem 0",
      }}
    >
      <button
        type="button"
        className="btn"
        aria-pressed={selectedTagId === null}
        onClick={() => onSelect(null)}
        style={{
          flexShrink: 0,
          background: selectedTagId === null ? "var(--bg-2)" : undefined,
          border: selectedTagId === null ? "2px solid var(--text-dim)" : undefined,
        }}
      >
        Sem etiqueta
      </button>
      {tags.map((tag) => {
        const isSelected = tag.id === selectedTagId;
        return (
          <button
            key={tag.id}
            type="button"
            className="btn"
            aria-pressed={isSelected}
            onClick={() => onSelect(tag.id)}
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
  );
}
