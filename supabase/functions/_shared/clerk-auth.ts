// @ts-nocheck
/* eslint-disable */
import {
  createRemoteJWKSet,
  jwtVerify,
} from "https://esm.sh/jose@5.10.0";

const issuer = Deno.env.get("CLERK_ISSUER") ?? "";
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

/**
 * Verifies the Clerk session JWT on the request's Authorization header.
 * Returns the Clerk user id (the `sub` claim) or null when the token is
 * missing, malformed, expired, or signed by another issuer.
 */
export async function verifyClerkRequest(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  if (!issuer) throw new Error("CLERK_ISSUER not set");
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  }

  try {
    const { payload } = await jwtVerify(token, jwks, { issuer });
    return typeof payload.sub === "string" && payload.sub.length > 0
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}
