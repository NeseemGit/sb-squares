import { NextResponse } from "next/server";
import {
  decodeJwtPayload,
  getSquare,
  isAdminFromPayload,
  updateSquare,
} from "@/lib/appsync-square";

/**
 * Secure unclaim: caller must own the square, or be an Admin (can unclaim any square).
 * Client must send Authorization: Bearer <idToken>. Optional: accessToken in JSON body
 * so we can read cognito:groups from the access token if not present in the id token.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 },
    );
  }

  let body: { squareId?: string; accessToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const payload = decodeJwtPayload(token);
  const sub = payload.sub;
  if (!sub) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 },
    );
  }

  // Prefer groups from access token (Cognito often puts cognito:groups there); avoid long tokens in headers (431)
  const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : undefined;
  const groupsPayload = accessToken ? decodeJwtPayload(accessToken) : payload;
  const isAdmin = isAdminFromPayload(groupsPayload);

  const squareId = body.squareId;
  if (!squareId || typeof squareId !== "string") {
    return NextResponse.json(
      { error: "Missing squareId" },
      { status: 400 },
    );
  }

  const square = await getSquare(squareId);
  if (!square) {
    return NextResponse.json(
      { error: "Square not found" },
      { status: 404 },
    );
  }

  if (!isAdmin && square.ownerId !== sub) {
    return NextResponse.json(
      { error: "You can only unclaim your own square" },
      { status: 403 },
    );
  }

  const result = await updateSquare(
    {
      id: squareId,
      ownerId: "",
      ownerName: "",
      claimedAt: "",
    },
    token,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Update failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
