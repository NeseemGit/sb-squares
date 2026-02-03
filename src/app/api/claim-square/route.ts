import { NextResponse } from "next/server";
import {
  decodeJwtPayload,
  getSquare,
  updateSquare,
} from "@/lib/appsync-square";

/**
 * Secure claim: only allows claiming when the square is unclaimed.
 * Client must send Authorization: Bearer <idToken>.
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

  const payload = decodeJwtPayload(token);
  const sub = payload.sub;
  if (!sub) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 },
    );
  }

  let body: { squareId?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

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

  if (square.ownerId != null && square.ownerId !== "") {
    return NextResponse.json(
      { error: "Square is already claimed" },
      { status: 403 },
    );
  }

  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim()
      : "Me";
  const claimedAt = new Date().toISOString();

  const result = await updateSquare(
    {
      id: squareId,
      ownerId: sub,
      ownerName: displayName,
      claimedAt,
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
