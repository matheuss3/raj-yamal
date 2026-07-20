import type { AccountData, Tag } from "../../shared/types.ts";
import { errorResponse, jsonResponse } from "./_lib/http.ts";
import { updateAccount } from "./_lib/blobStore.ts";
import { requireAccountHash } from "./_lib/hash.ts";
import { ValidationError, validateEntityId, validateNewTag, validateUpdateTag } from "./_lib/validation.ts";

class NotFoundError extends Error {}

function mutateAccount(current: AccountData | null): AccountData {
  if (!current) throw new NotFoundError("Conta não encontrada");
  return current;
}

export default async (req: Request): Promise<Response> => {
  try {
    const hash = requireAccountHash(req);

    if (req.method === "POST") {
      const input = validateNewTag(await req.json());
      const now = new Date().toISOString();

      const data = await updateAccount<AccountData>(hash, (current) => {
        const account = mutateAccount(current);
        const tag: Tag = {
          id: crypto.randomUUID(),
          name: input.name,
          color: input.color,
          monthlyBudget: input.monthlyBudget,
          archived: false,
          createdAt: now,
        };
        return { ...account, tags: [...account.tags, tag], updatedAt: now };
      });

      return jsonResponse(201, { data });
    }

    if (req.method === "PUT") {
      const input = validateUpdateTag(await req.json());
      const now = new Date().toISOString();

      const data = await updateAccount<AccountData>(hash, (current) => {
        const account = mutateAccount(current);
        const exists = account.tags.some((t) => t.id === input.id);
        if (!exists) throw new NotFoundError("Etiqueta não encontrada");

        return {
          ...account,
          updatedAt: now,
          tags: account.tags.map((t) =>
            t.id === input.id
              ? { ...t, name: input.name, color: input.color, monthlyBudget: input.monthlyBudget, archived: input.archived }
              : t,
          ),
        };
      });

      return jsonResponse(200, { data });
    }

    if (req.method === "DELETE") {
      // Arquiva em vez de remover: compras antigas continuam com sua categorização
      // e a visão histórica por etiqueta não é perdida (ver campo `archived` no schema).
      const id = validateEntityId(await req.json());
      const now = new Date().toISOString();

      const data = await updateAccount<AccountData>(hash, (current) => {
        const account = mutateAccount(current);
        const exists = account.tags.some((t) => t.id === id);
        if (!exists) throw new NotFoundError("Etiqueta não encontrada");

        return {
          ...account,
          updatedAt: now,
          tags: account.tags.map((t) => (t.id === id ? { ...t, archived: true } : t)),
        };
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
