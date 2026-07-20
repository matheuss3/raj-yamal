import { ValidationError } from "./validation.ts";

// Alfabeto de exatamente 32 caracteres (necessário para o índice de 5 bits abaixo:
// & 31 produz valores de 0 a 31, e um alfabeto menor causaria índice fora do array).
// Exclui apenas os pares realmente ambíguos na digitação manual: 0/O, 1/l.
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";
const BLOCK_SIZE = 4;
const BLOCK_COUNT = 4; // 16 caracteres úteis * 5 bits = 80 bits de entropia

const HASH_FORMAT = /^[23456789abcdefghijkmnpqrstuvwxyz]{4}-[23456789abcdefghijkmnpqrstuvwxyz]{4}-[23456789abcdefghijkmnpqrstuvwxyz]{4}-[23456789abcdefghijkmnpqrstuvwxyz]{4}$/;

export function generateAccountHash(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);

  let bits = 0;
  let value = 0;
  let encoded = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      encoded += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  const chars = encoded.slice(0, BLOCK_SIZE * BLOCK_COUNT);
  const blocks: string[] = [];
  for (let i = 0; i < chars.length; i += BLOCK_SIZE) {
    blocks.push(chars.slice(i, i + BLOCK_SIZE));
  }
  return blocks.join("-");
}

export function isValidAccountHashFormat(value: string): boolean {
  return HASH_FORMAT.test(value.toLowerCase());
}

export function normalizeAccountHash(value: string): string {
  return value.trim().toLowerCase();
}

/** Lê e valida o header X-Account-Hash de uma request; lança ValidationError se ausente/inválido. */
export function requireAccountHash(req: Request): string {
  const raw = req.headers.get("x-account-hash");
  if (!raw) throw new ValidationError("Header X-Account-Hash ausente");

  const hash = normalizeAccountHash(raw);
  if (!isValidAccountHashFormat(hash)) throw new ValidationError("Formato de hash inválido");

  return hash;
}
