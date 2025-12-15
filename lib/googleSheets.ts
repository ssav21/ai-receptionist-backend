// lib/googleSheets.ts
import { google } from "googleapis";

// Accept a few common env var names to avoid mismatches
const SPREADSHEET_ID =
  process.env.GOOGLE_SHEETS_ID ||
  process.env.GOOGLE_SHEET_ID ||
  process.env.SPREADSHEET_ID ||
  process.env.SHEET_ID;

const GOOGLE_CLIENT_EMAIL =
  process.env.GOOGLE_CLIENT_EMAIL ||
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

const GOOGLE_PRIVATE_KEY =
  process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

function missingEnvError() {
  const details = {
    hasSpreadsheetId: !!SPREADSHEET_ID,
    hasClientEmail: !!GOOGLE_CLIENT_EMAIL,
    hasPrivateKey: !!GOOGLE_PRIVATE_KEY,
    // show which key name is being used (helps debugging)
    spreadsheetIdVar:
      process.env.GOOGLE_SHEETS_ID
        ? "GOOGLE_SHEETS_ID"
        : process.env.GOOGLE_SHEET_ID
        ? "GOOGLE_SHEET_ID"
        : process.env.SPREADSHEET_ID
        ? "SPREADSHEET_ID"
        : process.env.SHEET_ID
        ? "SHEET_ID"
        : "NONE",
    clientEmailVar: process.env.GOOGLE_CLIENT_EMAIL
      ? "GOOGLE_CLIENT_EMAIL"
      : process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      ? "GOOGLE_SERVICE_ACCOUNT_EMAIL"
      : "NONE",
    privateKeyVar: process.env.GOOGLE_PRIVATE_KEY
      ? "GOOGLE_PRIVATE_KEY"
      : process.env.GOOGLE_SERVICE_ACCOUNT_KEY
      ? "GOOGLE_SERVICE_ACCOUNT_KEY"
      : "NONE",
  };

  return new Error(
    `[googleSheets] Missing env vars: ${JSON.stringify(details)}`
  );
}

function getSheetsClient() {
  if (!SPREADSHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw missingEnvError();
  }

  // Positional JWT constructor (cast to any so TS doesn't complain)
  const jwtClient = new (google.auth.JWT as any)(
    GOOGLE_CLIENT_EMAIL,
    undefined,
    GOOGLE_PRIVATE_KEY,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  return google.sheets({ version: "v4", auth: jwtClient });
}

export type AppendBookingRowInput = {
  businessId: string; // not written into your current sheet layout
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: string;
};

/**
 * Appends to tab: Bookings
 * Columns in your screenshot: Name | Phone | Service | Date | Time | Status
 */
export async function appendBookingRow(input: AppendBookingRowInput) {
  const sheets = getSheetsClient();

  const { name, phone, service, date, time, status } = input;
  const values = [[name, phone, service, date, time, status]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID!,
    range: "Bookings!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}















