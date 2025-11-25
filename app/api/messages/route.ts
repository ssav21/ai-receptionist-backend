// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";

// POST /api/messages  -> simple test response
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  return NextResponse.json(
    {
      ok: true,
      message: "POST /api/messages reached successfully",
      receivedBody: body,
    },
    { status: 201 }
  );
}

// GET /api/messages -> simple test
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: "GET /api/messages reached successfully",
    },
    { status: 200 }
  );
}

