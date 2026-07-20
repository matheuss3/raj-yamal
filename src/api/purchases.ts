import type { AccountData, NewPurchaseInput, UpdatePurchaseInput } from "../../shared/types";
import { apiFetch } from "./client";

export function createPurchase(input: NewPurchaseInput) {
  return apiFetch<{ data: AccountData }>("/api/purchases", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePurchase(input: UpdatePurchaseInput) {
  return apiFetch<{ data: AccountData }>("/api/purchases", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deletePurchase(id: string) {
  return apiFetch<{ data: AccountData }>("/api/purchases", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}
