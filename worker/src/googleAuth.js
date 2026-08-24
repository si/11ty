/**
 * Google service-account OAuth2 token exchange, implemented with the
 * Workers runtime's built-in Web Crypto (`crypto.subtle`) - no googleapis
 * SDK, no extra dependencies. Standard JWT-bearer flow:
 * https://developers.google.com/identity/protocols/oauth2/service-account
 *
 * Requires two Worker secrets (`wrangler secret put <NAME>`):
 *   - GOOGLE_SERVICE_ACCOUNT_EMAIL - the service account's client_email
 *   - GOOGLE_PRIVATE_KEY - the service account's private_key (PEM, with
 *     literal "\n" line breaks preserved - paste the JSON key file's
 *     private_key value exactly as-is)
 *
 * The service account needs edit access shared to each habit's Google
 * Sheet (Share -> add the service account's email, Editor role).
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem) {
  const normalized = pem.replace(/\\n/g, "\n");
  const base64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function signJwt(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: SHEETS_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const unsigned =
    base64UrlEncode(encoder.encode(JSON.stringify(header))) +
    "." +
    base64UrlEncode(encoder.encode(JSON.stringify(claims)));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(env.GOOGLE_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(unsigned)
  );

  return `${unsigned}.${base64UrlEncode(new Uint8Array(signature))}`;
}

// Cached per-isolate (module-scope), not per-request - Workers reuse an
// isolate across many requests, so this avoids re-signing a JWT and
// round-tripping to Google on every single API call.
let cachedToken = null;
let cachedTokenExpiresAt = 0;

export async function getAccessToken(env) {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const assertion = await signJwt(env);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google token exchange failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}
