// lib/googleSheets.ts
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEETS_BOOKINGS_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(
  /\\n/g,
  "\n"
);

const sheetsClient =
  SHEET_ID && GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY
    ? google.sheets({
        version: "v4",
        auth: new google.auth.JWT(
          GOOGLE_CLIENT_EMAIL,
          undefined,
          GOOGLE_PRIVATE_KEY,
          ["https://www.googleapis.com/auth/spreadsheets"]
        ),
      })
    : null;

// 🔹 IMPORTANT: include businessId here
export type BookingRowInput = {
  businessId: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: string;
};

export async function appendBookingRow(input: BookingRowInput) {
  if (!sheetsClient || !SHEET_ID) {
    console.warn("[googleSheets] Sheets client not initialised – skipping append.");
    return;
  }

  const { businessId, name, phone, service, date, time, status } = input;

  const values = [[businessId, name, phone, service, date, time, status]];

  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
}










