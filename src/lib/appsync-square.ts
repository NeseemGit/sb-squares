/**
 * Server-only helpers for secure Square claim/unclaim via AppSync.
 * Used by API routes to validate and perform updates with the user's token.
 */

import outputs from "@/amplify_outputs.json";

const DATA_URL = outputs?.data?.url;
const API_KEY = outputs?.data?.api_key;

function isConfigured(): boolean {
  return Boolean(DATA_URL && API_KEY && !String(DATA_URL).includes("PLACEHOLDER"));
}

/** Decode JWT payload (no verify; AppSync validates when we forward the token). */
export function decodeJwtPayload(token: string): {
  sub?: string;
  "cognito:groups"?: string[];
} {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    return JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { sub?: string; "cognito:groups"?: string[] };
  } catch {
    return {};
  }
}

export function isAdminFromPayload(payload: { "cognito:groups"?: string[] }): boolean {
  const groups = payload["cognito:groups"];
  return Array.isArray(groups) && groups.includes("Admins");
}

export interface SquareRecord {
  id: string;
  ownerId: string | null;
  ownerName: string | null;
  claimedAt: string | null;
}

/** Fetch a Square by id using API key (read-only). */
export async function getSquare(squareId: string): Promise<SquareRecord | null> {
  if (!isConfigured()) return null;
  const query = `
    query GetSquare($id: ID!) {
      getSquare(id: $id) {
        id
        ownerId
        ownerName
        claimedAt
      }
    }
  `;
  const res = await fetch(DATA_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY!,
    },
    body: JSON.stringify({
      query,
      variables: { id: squareId },
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: { getSquare?: SquareRecord };
    errors?: unknown[];
  };
  if (json.errors?.length) return null;
  return json.data?.getSquare ?? null;
}

/** Call updateSquare with the user's Cognito token (userPool auth). Claim/unclaim rules enforced by API routes. */
export async function updateSquare(
  input: {
    id: string;
    ownerId?: string;
    ownerName?: string;
    claimedAt?: string;
  },
  idToken: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured()) return { success: false, error: "Backend not configured" };
  const mutation = `
    mutation UpdateSquare($input: UpdateSquareInput!) {
      updateSquare(input: $input) {
        id
      }
    }
  `;
  const res = await fetch(DATA_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: { input },
    }),
  });
  if (!res.ok) return { success: false, error: `Request failed: ${res.status}` };
  const json = (await res.json()) as { data?: unknown; errors?: { message?: string }[] };
  if (json.errors?.length) {
    return { success: false, error: json.errors[0]?.message ?? "Update failed" };
  }
  return { success: true };
}
