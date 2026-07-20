import type { NewTagInput, Tag } from "../../../shared/types";
import { formatCentsToBRL } from "../../utils/currency";
import { TagForm } from "./TagForm";

interface TagManagerProps {
  tags: Tag[];
  onCreate: (input: NewTagInput) => Promise<unknown>;
  onArchive: (id: string) => void;
}

export function TagManager({ tags, onCreate, onArchive }: TagManagerProps) {
  const activeTags = tags.filter((tag) => !tag.archived);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <TagForm onSubmit={onCreate} />

      {activeTags.length === 0 ? (
        <p style={{ color: "var(--text-dim)" }}>Nenhuma etiqueta criada ainda.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {activeTags.map((tag) => (
            <li
              key={tag.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem 0.75rem",
                background: "var(--bg-1)",
                borderRadius: "var(--radius-sm)",
                padding: "0.75rem 1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, overflowWrap: "break-word" }}>
                <span
                  aria-hidden="true"
                  style={{ width: "0.85rem", height: "0.85rem", borderRadius: "999px", background: tag.color, display: "inline-block" }}
                />
                <span>{tag.name}</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                {tag.monthlyBudget != null && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-dim)" }}>
                    {formatCentsToBRL(tag.monthlyBudget)}/mês
                  </span>
                )}
                <button
                  type="button"
                  className="btn"
                  onClick={() => onArchive(tag.id)}
                  aria-label={`Arquivar etiqueta ${tag.name}`}
                >
                  Arquivar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
