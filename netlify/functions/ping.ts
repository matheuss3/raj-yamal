import { errorResponse, jsonResponse } from "./_lib/http.ts";
import { updateAccount } from "./_lib/blobStore.ts";

interface PingRecord {
  hits: number;
  lastHitAt: string;
}

const PING_KEY = "__ping__";

export default async (req: Request): Promise<Response> => {
  if (req.method !== "GET" && req.method !== "POST") {
    return errorResponse(405, "Método não suportado");
  }

  const result = await updateAccount<PingRecord>(PING_KEY, (current) => ({
    hits: (current?.hits ?? 0) + 1,
    lastHitAt: new Date().toISOString(),
  }));

  return jsonResponse(200, { ok: true, store: "netlify-blobs", ...result });
};
