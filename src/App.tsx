import { useState } from "react";
import type { NewPurchaseInput } from "../shared/types";
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
  const { status, error, data, addPurchase, removePurchase, addTag, removeTag, switchAccount, rotateHash, signOut } =
    useAccountData();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [view, setView] = useState<View>("purchases");
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showPurchaseList, setShowPurchaseList] = useState(false);

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

  async function handleAddPurchase(input: NewPurchaseInput) {
    await addPurchase(input);
    setShowAddPurchase(false);
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
          <MonthFilter months={months} selected={selectedMonth} onSelect={setSelectedMonth} />

          {tagsWithBudget.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {tagsWithBudget.map((tag) => (
                <BudgetIndicator key={tag.id} tag={tag} spentCents={spentByTag.get(tag.id) ?? 0} />
              ))}
            </div>
          )}

          <MonthTotalCard totalCents={totalCents} />

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" className="btn btn--accent" onClick={() => setShowAddPurchase(true)}>
              + Novo gasto
            </button>
            <button type="button" className="btn" onClick={() => setShowPurchaseList(true)}>
              Ver gastos detalhados
            </button>
          </div>

          <Modal open={showAddPurchase} onClose={() => setShowAddPurchase(false)} title="Novo gasto">
            <PurchaseForm tags={data.tags} onSubmit={handleAddPurchase} />
          </Modal>

          <Modal open={showPurchaseList} onClose={() => setShowPurchaseList(false)} title="Gastos detalhados">
            <PurchaseList purchases={purchasesOfMonth} tags={data.tags} onDelete={removePurchase} />
          </Modal>
        </>
      )}

      {view === "tags" && <TagManager tags={data.tags} onCreate={addTag} onArchive={removeTag} />}

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
