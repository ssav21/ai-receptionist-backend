// app/api/sheets-test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { appendBookingRow } from "@/lib/googleSheets";

export const dynamic = "force-dynamic"; // ensure it's always run on the server

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(_req: NextRequest) {
  try {
    // Send a very simple, fixed test row
    await appendBookingRow({
      businessId: "test-business",
      name: "Test User",
      phone: "+61400111222",
      service: "Test Service",
      date: "2025-12-12",
      time: "15:00",
      status: "test",
    });

    return new NextResponse(
      JSON.stringify({
        ok: true,
        message: "Successfully appended a test row to Google Sheets.",
      }),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("[/api/sheets-test] Error appending row:", err);

    return new NextResponse(
      JSON.stringify({
        ok: false,
        message: "Failed to append row to Google Sheets.",
        error: String(err?.message || err),
      }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function GET() {
  return new NextResponse(
    JSON.stringify({
      ok: true,
      message: "Sheets test endpoint is alive. Send a POST to append a row.",
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
