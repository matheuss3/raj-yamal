import { useState } from "react";
import type { Purchase, Tag } from "../../../shared/types";
import { Icon } from "../../components/Icon";
import { TagPicker } from "../tags/TagPicker";
import { formatCentsToBRL } from "../../utils/currency";

interface PurchaseListProps {
  purchases: Purchase[];
  tags: Tag[];
  onDelete: (id: string) => void;
  onUpdateTag: (purchase: Purchase, tagId: string | null) => void;
}

export function PurchaseList({ purchases, tags, onDelete, onUpdateTag }: PurchaseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (purchases.length === 0) {
    return <p style={{ color: "var(--text-dim)" }}>Nenhum gasto registrado neste mês.</p>;
  }

  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const activeTags = tags.filter((tag) => !tag.archived);

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
              <div style={{ minWidth: 0, overflowWrap: "break-word" }}>
                <div>{purchase.description}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  <span>{purchase.date}</span>
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
                <strong style={{ fontFamily: "var(--font-mono)" }}>{formatCentsToBRL(purchase.amountCents)}</strong>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onDelete(purchase.id)}
                  aria-label={`Excluir gasto: ${purchase.description}`}
                >
                  <Icon name="delete" size={18} />
                </button>
              </div>
            </div>

            {isEditing && (
              <TagPicker
                tags={activeTags}
                selectedTagId={purchase.tagId}
                onSelect={(tagId) => {
                  onUpdateTag(purchase, tagId);
                  setEditingId(null);
                }}
                ariaLabel={`Etiqueta de: ${purchase.description}`}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
