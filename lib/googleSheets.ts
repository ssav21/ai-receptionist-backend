// lib/googleSheets.ts
import { google } from "googleapis";

// Try multiple possible env names so we don't break existing config
const SPREADSHEET_ID =
  process.env.GOOGLE_SHEETS_ID ||
  process.env.GOOGLE_SHEET_ID ||
  process.env.SPREADSHEET_ID ||
  process.env.SHEET_ID;

const GOOGLE_CLIENT_EMAIL =
  process.env.GOOGLE_CLIENT_EMAIL ||
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

const RAW_GOOGLE_PRIVATE_KEY =
  process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

// Fix escaped newlines in the private key (Vercel / env var style)
const GOOGLE_PRIVATE_KEY = RAW_GOOGLE_PRIVATE_KEY
  ? RAW_GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

if (!SPREADSHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  console.warn(
    "[googleSheets] Missing one or more env vars: " +
      JSON.stringify({
        hasSpreadsheetId: !!SPREADSHEET_ID,
        hasClientEmail: !!GOOGLE_CLIENT_EMAIL,
        hasPrivateKey: !!GOOGLE_PRIVATE_KEY,
      })
  );
}

// Use the older positional JWT constructor (which you had before),
// but cast to any so TypeScript accepts it.
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
  businessId: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: string;
};

/**
 * Appends a booking row to the Google Sheet.
 * Columns: Business ID | Name | Phone | Service | Date | Time | Status | Timestamp
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

  const { businessId, name, phone, service, date, time, status } = input;
  const timestamp = new Date().toISOString();

  const values = [
    [businessId, name, phone, service, date, time, status, timestamp],
  ];

  try {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      // 🔴 IMPORTANT: change "Bookings" here if your tab name is different
      // e.g. "Sheet1!A:H" if your tab is "Sheet1"
      range: "Bookings!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    console.log(
      "[googleSheets] Appended booking row. API response:",
      JSON.stringify(res.data)
    );
  } catch (err) {
    console.error("[googleSheets] Error appending booking row:", err);
    // We don't throw so that /api/messages still returns 200
  }
}













