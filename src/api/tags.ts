import type { AccountData, NewTagInput, UpdateTagInput } from "../../shared/types";
import { apiFetch } from "./client";

export function createTag(input: NewTagInput) {
  return apiFetch<{ data: AccountData }>("/api/tags", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTag(input: UpdateTagInput) {
  return apiFetch<{ data: AccountData }>("/api/tags", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

/** Arquiva a etiqueta (não é uma exclusão definitiva — ver netlify/functions/tags.ts). */
export function archiveTag(id: string) {
  return apiFetch<{ data: AccountData }>("/api/tags", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}
