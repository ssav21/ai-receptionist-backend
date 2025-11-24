import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "AI Receptionist backend is running",
    timestamp: new Date().toISOString(),
  });
}
