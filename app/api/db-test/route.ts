import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  if (!db) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Firestore not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars.",
      },
      { status: 500 }
    );
  }

  // Just return a basic ping for now
  return NextResponse.json({
    ok: true,
    message: "Firestore is configured",
  });
}
