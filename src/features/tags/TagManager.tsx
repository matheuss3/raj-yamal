import { useState } from "react";
import type { NewTagInput, Tag } from "../../../shared/types";
import { AsyncButton } from "../../components/AsyncButton";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { formatCentsToBRL } from "../../utils/currency";
import { TagForm } from "./TagForm";

interface TagManagerProps {
  tags: Tag[];
  onCreate: (input: NewTagInput) => Promise<unknown>;
  onArchive: (tag: Tag) => Promise<unknown>;
  onUnarchive: (tag: Tag) => Promise<unknown>;
}

function TagRow({
  tag,
  actionLabel,
  onAction,
}: {
  tag: Tag;
  actionLabel: string;
  onAction: () => Promise<unknown>;
}) {
  return (
    <li
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
        <AsyncButton onClick={onAction} ariaLabel={`${actionLabel} etiqueta ${tag.name}`}>
          {actionLabel}
        </AsyncButton>
      </div>
    </li>
  );
}

export function TagManager({ tags, onCreate, onArchive, onUnarchive }: TagManagerProps) {
  const [showArchived, setShowArchived] = useState(false);
  const activeTags = tags.filter((tag) => !tag.archived);
  const archivedTags = tags.filter((tag) => tag.archived);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <TagForm
        onSubmit={onCreate}
        extraAction={
          <button
            type="button"
            className="btn"
            onClick={() => setShowArchived(true)}
            aria-label="Ver etiquetas arquivadas"
            style={{ flex: "0 0 15%" }}
          >
            <Icon name="archive" size={18} />
          </button>
        }
      />

      {activeTags.length === 0 ? (
        <p style={{ color: "var(--text-dim)" }}>Nenhuma etiqueta criada ainda.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {activeTags.map((tag) => (
            <TagRow key={tag.id} tag={tag} actionLabel="Arquivar" onAction={() => onArchive(tag)} />
          ))}
        </ul>
      )}

      <Modal open={showArchived} onClose={() => setShowArchived(false)} title="Etiquetas arquivadas">
        {archivedTags.length === 0 ? (
          <p style={{ color: "var(--text-dim)" }}>Nenhuma etiqueta arquivada.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {archivedTags.map((tag) => (
              <TagRow key={tag.id} tag={tag} actionLabel="Desarquivar" onAction={() => onUnarchive(tag)} />
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
