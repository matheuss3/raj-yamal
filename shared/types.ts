export interface Tag {
  id: string;
  name: string;
  color: string;
  /** Orçamento mensal ideal, em centavos. null = sem orçamento definido. */
  monthlyBudget: number | null;
  archived: boolean;
  createdAt: string;
}

export interface Purchase {
  id: string;
  description: string;
  /** Valor da compra, sempre em centavos (inteiro). */
  amountCents: number;
  /** Data da compra, formato YYYY-MM-DD. */
  date: string;
  tagId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountData {
  accountHash: string;
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  purchases: Purchase[];
}

export interface NewPurchaseInput {
  description: string;
  amountCents: number;
  date: string;
  tagId: string | null;
}

export interface UpdatePurchaseInput extends NewPurchaseInput {
  id: string;
}

export interface NewTagInput {
  name: string;
  color: string;
  monthlyBudget: number | null;
}

export interface UpdateTagInput extends NewTagInput {
  id: string;
}

export function createEmptyAccountData(accountHash: string): AccountData {
  const now = new Date().toISOString();
  return {
    accountHash,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    tags: [],
    purchases: [],
  };
}
