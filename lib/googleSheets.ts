// lib/googleSheets.ts
import { google } from "googleapis";

const SPREADSHEET_ID =
  process.env.GOOGLE_SHEETS_ID;

// Support BOTH env var naming conventions (Option A + Option B)
const GOOGLE_CLIENT_EMAIL =
  process.env.GOOGLE_CLIENT_EMAIL ||
  process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

const GOOGLE_PRIVATE_KEY =
  process.env.GOOGLE_PRIVATE_KEY ||
  process.env.GOOGLE_SHEETS_PRIVATE_KEY;

// Debug helper (safe – does NOT log secrets)
function envStatus() {
  return {
    hasSpreadsheetId: Boolean(SPREADSHEET_ID),
    hasClientEmail: Boolean(GOOGLE_CLIENT_EMAIL),
    hasPrivateKey: Boolean(GOOGLE_PRIVATE_KEY),
    spreadsheetIdVar: SPREADSHEET_ID ? "GOOGLE_SHEETS_ID" : "NONE",
    clientEmailVar: process.env.GOOGLE_CLIENT_EMAIL
      ? "GOOGLE_CLIENT_EMAIL"
      : process.env.GOOGLE_SHEETS_CLIENT_EMAIL
      ? "GOOGLE_SHEETS_CLIENT_EMAIL"
      : "NONE",
    privateKeyVar: process.env.GOOGLE_PRIVATE_KEY
      ? "GOOGLE_PRIVATE_KEY"
      : process.env.GOOGLE_SHEETS_PRIVATE_KEY
      ? "GOOGLE_SHEETS_PRIVATE_KEY"
      : "NONE",
  };
}

function createSheetsClient() {
  if (!SPREADSHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    const status = envStatus();
    throw new Error(
      `[googleSheets] Missing env vars: ${JSON.stringify(status)}`
    );
  }

  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

export async function appendBookingRow(input: {
  businessId: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: string;
}) {
  const sheets = createSheetsClient();

  const values = [
    [
      input.name,
      input.phone,
      input.service,
      input.date,
      input.time,
      input.status,
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID!,
    range: "Bookings!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });

  return { ok: true };
}
















