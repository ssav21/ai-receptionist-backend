import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return new NextResponse(
    JSON.stringify({
      ok: true,
      marker: "VAPI-DEBUG-GET",
      message: "GET /api/vapi-debug is working",
    }),
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("[/api/vapi-debug] Failed to read body:", err);
  }

  console.log("[/api/vapi-debug] RAW BODY:", rawBody || "<empty>");

  let parsed: any = {};
  if (rawBody) {
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = { rawBody };
    }
  }

  console.log("[/api/vapi-debug] PARSED BODY:", parsed);

  return new NextResponse(
    JSON.stringify({
      ok: true,
      marker: "VAPI-DEBUG-POST",
      message: "Debug echo from /api/vapi-debug",
      received: parsed,
    }),
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    }
  );
}
