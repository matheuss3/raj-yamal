import { useState } from "react";
import type { NewPurchaseInput, NewTagInput, Purchase, Tag } from "../shared/types";
import { AccountScreen } from "./features/account/AccountScreen";
import { BudgetIndicator } from "./features/tags/BudgetIndicator";
import { TagManager } from "./features/tags/TagManager";
import { MonthFilter } from "./features/purchases/MonthFilter";
import { MonthTotalCard } from "./features/purchases/MonthTotalCard";
import { PurchaseForm } from "./features/purchases/PurchaseForm";
import { PurchaseList } from "./features/purchases/PurchaseList";
import { ThemeToggle } from "./features/theme/ThemeToggle";
import { Modal } from "./components/Modal";
import { AccountDataProvider, useAccountData } from "./state/AccountDataProvider";
import { logAction } from "./utils/actionLog";
import { formatCentsToBRL } from "./utils/currency";
import { currentMonthKey, listAvailableMonths, monthKeyFromDate } from "./utils/date";

type View = "purchases" | "tags" | "account";

const TABS: { key: View; label: string }[] = [
  { key: "purchases", label: "Gastos" },
  { key: "tags", label: "Etiquetas" },
  { key: "account", label: "Conta" },
];

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      className="btn"
      aria-selected={active}
      onClick={onClick}
      style={{ background: active ? "var(--accent)" : undefined, color: active ? "#ffffff" : undefined }}
    >
      {children}
    </button>
  );
}

function AppContent() {
  const {
    status,
    error,
    data,
    addPurchase,
    updatePurchase,
    removePurchase,
    addTag,
    removeTag,
    unarchiveTag,
    switchAccount,
    rotateHash,
    signOut,
  } = useAccountData();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [view, setView] = useState<View>("purchases");
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showPurchaseList, setShowPurchaseList] = useState(false);
  const [purchaseListTagFilter, setPurchaseListTagFilter] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <main className="container" style={{ paddingBlock: "2rem" }}>
        <p>Carregando seus dados…</p>
      </main>
    );
  }

  if (status === "error" || !data) {
    return (
      <main className="container" style={{ paddingBlock: "2rem" }}>
        <p style={{ color: "var(--accent-strong)" }}>Não foi possível carregar seus dados: {error}</p>
      </main>
    );
  }

  const months = listAvailableMonths(data.purchases, selectedMonth);
  const purchasesOfMonth = data.purchases
    .filter((purchase) => monthKeyFromDate(purchase.date) === selectedMonth)
    .sort((a, b) => b.date.localeCompare(a.date));
  const totalCents = purchasesOfMonth.reduce((sum, purchase) => sum + purchase.amountCents, 0);

  const spentByTag = new Map<string, number>();
  for (const purchase of purchasesOfMonth) {
    if (!purchase.tagId) continue;
    spentByTag.set(purchase.tagId, (spentByTag.get(purchase.tagId) ?? 0) + purchase.amountCents);
  }
  const tagsWithBudget = data.tags.filter((tag) => !tag.archived && tag.monthlyBudget != null);
  const tagById = new Map(data.tags.map((tag) => [tag.id, tag]));

  const purchasesForList = purchaseListTagFilter
    ? purchasesOfMonth.filter((purchase) => purchase.tagId === purchaseListTagFilter)
    : purchasesOfMonth;
  const purchaseListTagName = purchaseListTagFilter
    ? (data.tags.find((tag) => tag.id === purchaseListTagFilter)?.name ?? "")
    : null;

  async function handleAddPurchase(input: NewPurchaseInput) {
    await addPurchase(input);
    logAction(`Gasto adicionado: "${input.description}" (${formatCentsToBRL(input.amountCents)})`);
    setShowAddPurchase(false);
  }

  async function handleUpdatePurchaseTag(purchase: Purchase, tagId: string | null) {
    await updatePurchase({
      id: purchase.id,
      description: purchase.description,
      amountCents: purchase.amountCents,
      date: purchase.date,
      tagId,
    });
    const tagName = tagId ? (tagById.get(tagId)?.name ?? "etiqueta") : "sem etiqueta";
    logAction(`Etiqueta do gasto "${purchase.description}" alterada para ${tagName}`);
  }

  async function handleDeletePurchase(purchase: Purchase) {
    await removePurchase(purchase.id);
    logAction(`Gasto excluído: "${purchase.description}" (${formatCentsToBRL(purchase.amountCents)})`);
  }

  async function handleCreateTag(input: NewTagInput) {
    await addTag(input);
    logAction(`Etiqueta criada: ${input.name}`);
  }

  async function handleArchiveTag(tag: Tag) {
    await removeTag(tag.id);
    logAction(`Etiqueta arquivada: ${tag.name}`);
  }

  async function handleUnarchiveTag(tag: Tag) {
    await unarchiveTag(tag);
    logAction(`Etiqueta desarquivada: ${tag.name}`);
  }

  function openPurchaseList(tagFilter: string | null) {
    setPurchaseListTagFilter(tagFilter);
    setShowPurchaseList(true);
  }

  return (
    <main className="container" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", paddingBlock: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", margin: 0 }}>raj-yamal</h1>
        <ThemeToggle />
      </div>

      <nav role="tablist" aria-label="Seções" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {TABS.map((tab) => (
          <TabButton key={tab.key} active={view === tab.key} onClick={() => setView(tab.key)}>
            {tab.label}
          </TabButton>
        ))}
      </nav>

      {view === "purchases" && (
        <>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "8rem" }}>
              <MonthFilter months={months} selected={selectedMonth} onSelect={setSelectedMonth} />
            </div>
            <button type="button" className="btn btn--accent" onClick={() => setShowAddPurchase(true)}>
              + Gasto
            </button>
          </div>

          {tagsWithBudget.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {tagsWithBudget.map((tag) => (
                <BudgetIndicator
                  key={tag.id}
                  tag={tag}
                  spentCents={spentByTag.get(tag.id) ?? 0}
                  onViewDetails={() => openPurchaseList(tag.id)}
                />
              ))}
            </div>
          )}

          <MonthTotalCard totalCents={totalCents} />

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={() => openPurchaseList(null)}>
              Ver gastos detalhados
            </button>
          </div>

          <Modal open={showAddPurchase} onClose={() => setShowAddPurchase(false)} title="Novo gasto">
            <PurchaseForm tags={data.tags} onSubmit={handleAddPurchase} />
          </Modal>

          <Modal
            open={showPurchaseList}
            onClose={() => setShowPurchaseList(false)}
            title={purchaseListTagName ? `Gastos: ${purchaseListTagName}` : "Gastos detalhados"}
          >
            <PurchaseList
              purchases={purchasesForList}
              tags={data.tags}
              onDelete={handleDeletePurchase}
              onUpdateTag={handleUpdatePurchaseTag}
            />
          </Modal>
        </>
      )}

      {view === "tags" && (
        <TagManager tags={data.tags} onCreate={handleCreateTag} onArchive={handleArchiveTag} onUnarchive={handleUnarchiveTag} />
      )}

      {view === "account" && (
        <AccountScreen
          accountHash={data.accountHash}
          onSwitchAccount={switchAccount}
          onRotateHash={rotateHash}
          onSignOut={signOut}
        />
      )}
    </main>
  );
}

function App() {
  return (
    <AccountDataProvider>
      <AppContent />
    </AccountDataProvider>
  );
}

export default App;
