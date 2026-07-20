import type { AccountData, Purchase } from "../../shared/types.ts";
import { errorResponse, jsonResponse } from "./_lib/http.ts";
import { updateAccount } from "./_lib/blobStore.ts";
import { requireAccountHash } from "./_lib/hash.ts";
import { ValidationError, validateEntityId, validateNewPurchase, validateUpdatePurchase } from "./_lib/validation.ts";

class NotFoundError extends Error {}

function mutateAccount(current: AccountData | null): AccountData {
  if (!current) throw new NotFoundError("Conta não encontrada");
  return current;
}

export default async (req: Request): Promise<Response> => {
  try {
    const hash = requireAccountHash(req);

    if (req.method === "POST") {
      const input = validateNewPurchase(await req.json());
      const now = new Date().toISOString();

      const data = await updateAccount<AccountData>(hash, (current) => {
        const account = mutateAccount(current);
        const purchase: Purchase = {
          id: crypto.randomUUID(),
          description: input.description,
          amountCents: input.amountCents,
          date: input.date,
          tagId: input.tagId,
          createdAt: now,
          updatedAt: now,
        };
        return { ...account, purchases: [...account.purchases, purchase], updatedAt: now };
      });

      return jsonResponse(201, { data });
    }

    if (req.method === "PUT") {
      const input = validateUpdatePurchase(await req.json());
      const now = new Date().toISOString();

      const data = await updateAccount<AccountData>(hash, (current) => {
        const account = mutateAccount(current);
        const exists = account.purchases.some((p) => p.id === input.id);
        if (!exists) throw new NotFoundError("Compra não encontrada");

        return {
          ...account,
          updatedAt: now,
          purchases: account.purchases.map((p) =>
            p.id === input.id
              ? { ...p, description: input.description, amountCents: input.amountCents, date: input.date, tagId: input.tagId, updatedAt: now }
              : p,
          ),
        };
      });

      return jsonResponse(200, { data });
    }

    if (req.method === "DELETE") {
      const id = validateEntityId(await req.json());
      const now = new Date().toISOString();

      const data = await updateAccount<AccountData>(hash, (current) => {
        const account = mutateAccount(current);
        const exists = account.purchases.some((p) => p.id === id);
        if (!exists) throw new NotFoundError("Compra não encontrada");

        return { ...account, updatedAt: now, purchases: account.purchases.filter((p) => p.id !== id) };
      });

      return jsonResponse(200, { data });
    }

    return errorResponse(405, "Método não suportado");
  } catch (err) {
    if (err instanceof ValidationError) return errorResponse(400, err.message);
    if (err instanceof NotFoundError) return errorResponse(404, err.message);
    console.error(err);
    return errorResponse(500, "Erro interno");
  }
};
