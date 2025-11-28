// lib/googleSheets.ts
import { google, sheets_v4 } from "googleapis";

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets | null {
  if (sheetsClient) return sheetsClient;

  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    console.warn(
      "[googleSheets] Missing GOOGLE_SHEETS_CLIENT_EMAIL or GOOGLE_SHEETS_PRIVATE_KEY. Sheets integration disabled."
    );
    return null;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const BOOKINGS_RANGE = process.env.GOOGLE_SHEETS_RANGE || "Bookings!A2:H";
// If your tab isn't called "Bookings", change that string above

// Check if a booking already exists for the same date + time
export async function isSlotTaken(
  requestedDate: string,
  requestedTime: string
): Promise<boolean> {
  const sheets = getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) return false;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: BOOKINGS_RANGE,
  });

  const rows = res.data.values || [];
  const targetDate = (requestedDate || "").trim();
  const targetTime = (requestedTime || "").trim();

  // Columns: A Timestamp, B BusinessId, C Name, D Phone, E Service, F Date, G Time, H Status
  return rows.some((row) => {
    const rowDate = (row[5] || "").trim(); // column F
    const rowTime = (row[6] || "").trim(); // column G
    return rowDate === targetDate && rowTime === targetTime;
  });
}

type AppendBookingParams = {
  businessId: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: string;
};

export async function appendBookingRow(params: AppendBookingParams) {
  const sheets = getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) {
    console.warn("[googleSheets] Sheets client not initialised; skipping append.");
    return;
  }

  const nowIso = new Date().toISOString();

  const values = [
    [
      nowIso,                // Timestamp
      params.businessId,     // BusinessId
      params.name,           // Name
      params.phone,          // Phone
      params.service,        // Service
      params.date,           // Date
      params.time,           // Time
      params.status,         // Status
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: BOOKINGS_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}
