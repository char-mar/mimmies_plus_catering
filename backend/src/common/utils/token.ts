import { createHash, randomBytes } from "node:crypto";

// Opaque tokens are only ever given to the client. The database stores a hash
// so a database leak cannot be replayed against the API.
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
