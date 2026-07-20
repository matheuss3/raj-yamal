import type { AccountData } from "../../shared/types.ts";
import { createEmptyAccountData } from "../../shared/types.ts";
import { errorResponse, jsonResponse } from "./_lib/http.ts";
import { accountsStore, deleteAccount, getAccount } from "./_lib/blobStore.ts";
import { generateAccountHash, requireAccountHash } from "./_lib/hash.ts";
import { ValidationError } from "./_lib/validation.ts";

export default async (req: Request): Promise<Response> => {
  try {
    if (req.method === "POST") {
      const hash = generateAccountHash();
      const data = createEmptyAccountData(hash);
      await accountsStore().set(hash, JSON.stringify(data));
      return jsonResponse(201, { hash, data });
    }

    if (req.method === "GET") {
      const hash = requireAccountHash(req);
      const record = await getAccount<AccountData>(hash);
      if (!record) return errorResponse(404, "Conta não encontrada");
      return jsonResponse(200, { data: record.data });
    }

    if (req.method === "PATCH") {
      // Rotaciona o hash: gera um novo, migra todos os dados pra ele e apaga
      // a chave antiga. Serve como válvula de escape se o hash vazar (ex.:
      // print de tela, compartilhamento indevido) — o hash antigo passa a
      // retornar 404 imediatamente após a rotação.
      const oldHash = requireAccountHash(req);
      const record = await getAccount<AccountData>(oldHash);
      if (!record) return errorResponse(404, "Conta não encontrada");

      const newHash = generateAccountHash();
      const now = new Date().toISOString();
      const rotatedData: AccountData = { ...record.data, accountHash: newHash, updatedAt: now };

      await accountsStore().set(newHash, JSON.stringify(rotatedData));
      await deleteAccount(oldHash);

      return jsonResponse(200, { hash: newHash, data: rotatedData });
    }

    return errorResponse(405, "Método não suportado");
  } catch (err) {
    if (err instanceof ValidationError) return errorResponse(400, err.message);
    console.error(err);
    return errorResponse(500, "Erro interno");
  }
};
