import { useState } from "react";
import type { Purchase, Tag } from "../../../shared/types";
import { AsyncButton } from "../../components/AsyncButton";
import { Icon } from "../../components/Icon";
import { TagPicker } from "../tags/TagPicker";
import { formatCentsToBRL } from "../../utils/currency";
import { formatDateShort } from "../../utils/date";

interface PurchaseListProps {
  purchases: Purchase[];
  tags: Tag[];
  onDelete: (purchase: Purchase) => Promise<unknown>;
  onUpdateTag: (purchase: Purchase, tagId: string | null) => Promise<unknown>;
}

export function PurchaseList({ purchases, tags, onDelete, onUpdateTag }: PurchaseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingTag, setSavingTag] = useState(false);

  if (purchases.length === 0) {
    return <p style={{ color: "var(--text-dim)" }}>Nenhum gasto registrado neste mês.</p>;
  }

  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const activeTags = tags.filter((tag) => !tag.archived);

  async function handleSelectTag(purchase: Purchase, tagId: string | null) {
    setSavingTag(true);
    try {
      await onUpdateTag(purchase, tagId);
      setEditingId(null);
    } finally {
      setSavingTag(false);
    }
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {purchases.map((purchase) => {
        const tag = purchase.tagId ? tagById.get(purchase.tagId) : undefined;
        const isEditing = editingId === purchase.id;
        return (
          <li
            key={purchase.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              background: "var(--bg-1)",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem 1rem",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.5rem 0.75rem" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                  <span style={{ minWidth: 0, overflowWrap: "break-word" }}>{purchase.description}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-dim)",
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDateShort(purchase.date)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
                  {tag && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span
                        aria-hidden="true"
                        style={{ width: "0.6rem", height: "0.6rem", borderRadius: "999px", background: tag.color, display: "inline-block" }}
                      />
                      {tag.name}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setEditingId(isEditing ? null : purchase.id)}
                    aria-label={`Editar etiqueta de: ${purchase.description}`}
                    style={{ minHeight: "1.75rem", minWidth: "1.75rem", padding: "0.25rem" }}
                  >
                    <Icon name="edit" size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                <strong>{formatCentsToBRL(purchase.amountCents)}</strong>
                <AsyncButton
                  onClick={() => onDelete(purchase)}
                  ariaLabel={`Excluir gasto: ${purchase.description}`}
                >
                  <Icon name="delete" size={18} />
                </AsyncButton>
              </div>
            </div>

            {isEditing && (
              <TagPicker
                tags={activeTags}
                selectedTagId={purchase.tagId}
                onSelect={(tagId) => handleSelectTag(purchase, tagId)}
                disabled={savingTag}
                ariaLabel={`Etiqueta de: ${purchase.description}`}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
