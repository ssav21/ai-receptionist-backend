// lib/googleSheets.ts
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const RAW_GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// Fix escaped newlines in the private key (common with env vars)
const GOOGLE_PRIVATE_KEY = RAW_GOOGLE_PRIVATE_KEY
  ? RAW_GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

if (!SPREADSHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  console.warn(
    "[googleSheets] Missing one or more env vars: GOOGLE_SHEETS_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY"
  );
}

function getSheetsClient() {
  if (!SPREADSHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error(
      "[googleSheets] Cannot create Sheets client – missing env vars."
    );
  }

  console.log("[googleSheets] Creating JWT client for Sheets", {
    hasSpreadsheetId: !!SPREADSHEET_ID,
    clientEmail: GOOGLE_CLIENT_EMAIL,
  });

  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({
    version: "v4",
    auth,
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
      "[googleSheets] GOOGLE_SHEETS_ID not set – skipping appendBookingRow."
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
      range: "Bookings!A:H", // <-- tab must be named "Bookings"
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(
      "[googleSheets] Appended booking row. Update response:",
      JSON.stringify(res.data)
    );
  } catch (err) {
    console.error("[googleSheets] Error appending booking row:", err);
    throw err;
  }
}












