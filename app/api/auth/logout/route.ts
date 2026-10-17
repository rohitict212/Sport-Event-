import { NextResponse } from "next/server";

import { deleteCurrentSession } from "@/lib/auth/session";
import { isSameOriginRequest } from "@/lib/auth/request";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  try {
    await deleteCurrentSession();
    return NextResponse.json({ message: "Signed out." });
  } catch (error) {
    console.error("Sign-out failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to sign out right now." }, { status: 500 });
  }
}
