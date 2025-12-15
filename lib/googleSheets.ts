// lib/googleSheets.ts
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const RAW_GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// Fix escaped newlines in the private key (Vercel-style env)
const GOOGLE_PRIVATE_KEY = RAW_GOOGLE_PRIVATE_KEY
  ? RAW_GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

if (!SPREADSHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  console.warn(
    "[googleSheets] Missing env vars:",
    JSON.stringify({
      hasSpreadsheetId: !!SPREADSHEET_ID,
      hasClientEmail: !!GOOGLE_CLIENT_EMAIL,
      hasPrivateKey: !!GOOGLE_PRIVATE_KEY,
    })
  );
}

function getSheetsClient() {
  if (!SPREADSHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error(
      "[googleSheets] Cannot create Sheets client – missing env vars."
    );
  }

  console.log("[googleSheets] Creating JWT client", {
    clientEmail: GOOGLE_CLIENT_EMAIL,
    hasSpreadsheetId: !!SPREADSHEET_ID,
  });

  // Use older positional constructor, but cast to any so TS allows it
  const jwtClient = new (google.auth.JWT as any)(
    GOOGLE_CLIENT_EMAIL,
    undefined,
    GOOGLE_PRIVATE_KEY,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  const sheets = google.sheets({
    version: "v4",
    auth: jwtClient,
  });

  return sheets;
}

export type AppendBookingRowInput = {
  businessId: string; // still passed in, but not written to sheet
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: string;
};

/**
 * Appends a booking row to the "Bookings" sheet.
 * Columns: Name | Phone | Service | Date | Time | Status
 */
export async function appendBookingRow(input: AppendBookingRowInput) {
  if (!SPREADSHEET_ID) {
    console.warn(
      "[googleSheets] SPREADSHEET_ID not set – skipping appendBookingRow."
    );
    return;
  }

  console.log("[googleSheets] appendBookingRow called with:", input);

  const sheets = getSheetsClient();

  const { name, phone, service, date, time, status } = input;

  const values = [[name, phone, service, date, time, status]];

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    // 🔴 Tab name MUST be exactly "Bookings" (which your screenshot shows)
    range: "Bookings!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  console.log(
    "[googleSheets] Appended booking row. API response:",
    JSON.stringify(res.data)
  );
}














