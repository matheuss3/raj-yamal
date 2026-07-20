import type { NewPurchaseInput, NewTagInput, UpdatePurchaseInput, UpdateTagInput } from "../../shared/types.ts";

export class ValidationError extends Error {}

const MAX_DESCRIPTION_LENGTH = 140;
const MAX_AMOUNT_CENTS = 999_999_999; // ~ R$ 9.999.999,99
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TAG_NAME_LENGTH = 40;
const HEX_COLOR_FORMAT = /^#[0-9a-f]{6}$/i;

function asRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("Payload inválido");
  }
  return body as Record<string, unknown>;
}

function validateCommonFields(record: Record<string, unknown>): NewPurchaseInput {
  const { description, amountCents, date, tagId } = record;

  if (typeof description !== "string" || description.trim().length === 0) {
    throw new ValidationError("Descrição é obrigatória");
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError(`Descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres`);
  }
  if (typeof amountCents !== "number" || !Number.isInteger(amountCents) || amountCents <= 0) {
    throw new ValidationError("Valor deve ser um inteiro positivo em centavos");
  }
  if (amountCents > MAX_AMOUNT_CENTS) {
    throw new ValidationError("Valor excede o limite permitido");
  }
  if (typeof date !== "string" || !DATE_FORMAT.test(date)) {
    throw new ValidationError("Data deve estar no formato YYYY-MM-DD");
  }
  if (tagId !== null && tagId !== undefined && typeof tagId !== "string") {
    throw new ValidationError("tagId inválido");
  }

  return {
    description: description.trim(),
    amountCents,
    date,
    tagId: (tagId as string | undefined) ?? null,
  };
}

export function validateNewPurchase(body: unknown): NewPurchaseInput {
  return validateCommonFields(asRecord(body));
}

export function validateUpdatePurchase(body: unknown): UpdatePurchaseInput {
  const record = asRecord(body);
  const { id } = record;
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new ValidationError("id é obrigatório");
  }
  return { id, ...validateCommonFields(record) };
}

/** Extrai e valida um `{ id }` genérico, usado pelos endpoints DELETE (purchases e tags). */
export function validateEntityId(body: unknown): string {
  const record = asRecord(body);
  const { id } = record;
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new ValidationError("id é obrigatório");
  }
  return id;
}

function validateTagFields(record: Record<string, unknown>): NewTagInput {
  const { name, color, monthlyBudget } = record;

  if (typeof name !== "string" || name.trim().length === 0) {
    throw new ValidationError("Nome da etiqueta é obrigatório");
  }
  if (name.length > MAX_TAG_NAME_LENGTH) {
    throw new ValidationError(`Nome deve ter no máximo ${MAX_TAG_NAME_LENGTH} caracteres`);
  }
  if (typeof color !== "string" || !HEX_COLOR_FORMAT.test(color)) {
    throw new ValidationError("Cor deve estar no formato hexadecimal, ex: #ff0033");
  }
  if (monthlyBudget !== null && monthlyBudget !== undefined) {
    if (typeof monthlyBudget !== "number" || !Number.isInteger(monthlyBudget) || monthlyBudget <= 0) {
      throw new ValidationError("Orçamento deve ser um inteiro positivo em centavos");
    }
    if (monthlyBudget > MAX_AMOUNT_CENTS) {
      throw new ValidationError("Orçamento excede o limite permitido");
    }
  }

  return {
    name: name.trim(),
    color: color.toLowerCase(),
    monthlyBudget: (monthlyBudget as number | undefined) ?? null,
  };
}

export function validateNewTag(body: unknown): NewTagInput {
  return validateTagFields(asRecord(body));
}

export function validateUpdateTag(body: unknown): UpdateTagInput {
  const record = asRecord(body);
  const { id, archived } = record;
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new ValidationError("id é obrigatório");
  }
  if (typeof archived !== "boolean") {
    throw new ValidationError("archived deve ser booleano");
  }
  return { id, archived, ...validateTagFields(record) };
}
