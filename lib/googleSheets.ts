// lib/googleSheets.ts
import { google, sheets_v4 } from "googleapis";

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets | null {
  if (sheetsClient) return sheetsClient;

  // Reuse the same service account envs you already have for Firebase
  const clientEmail =
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL ||
    process.env.CLIENT_EMAIL ||
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey = (
    process.env.GOOGLE_SHEETS_PRIVATE_KEY ||
    process.env.PRIVATE_KEY ||
    process.env.FIREBASE_PRIVATE_KEY
  )?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    console.warn(
      "[googleSheets] Missing service account credentials. Sheets integration disabled.",
      { clientEmailPresent: !!clientEmail }
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
// You can override the tab name with an env var if you want
const SHEET_TAB = process.env.GOOGLE_SHEETS_TAB || "Bookings";

// 🔢 COLUMN INDEXES (A = 0, B = 1, etc.)
const NAME_COL = 0;    // Column A: Name
const PHONE_COL = 1;   // Column B: Phone
const SERVICE_COL = 2; // Column C: Service
const DATE_COL = 3;    // Column D: Date
const TIME_COL = 4;    // Column E: Time

// Range we read/write (A:E on your chosen tab)
const RANGE = `${SHEET_TAB}!A:E`;

export async function isSlotTaken(
  date: string,
  time: string
): Promise<boolean> {
  const sheets = getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) {
    console.warn("[googleSheets.isSlotTaken] Sheets not initialised");
    return false;
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values || [];
  const targetDate = (date || "").trim();
  const targetTime = (time || "").trim();

  // Skip header row (start from i = 1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const rowDate = (row[DATE_COL] || "").trim();
    const rowTime = (row[TIME_COL] || "").trim();

    if (rowDate === targetDate && rowTime === targetTime) {
      return true;
    }
  }

  return false;
}

type BookingRow = {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
};

export async function appendBookingRow(booking: BookingRow): Promise<void> {
  const sheets = getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) {
    console.warn("[googleSheets.appendBookingRow] Sheets not initialised");
    return;
  }

  const values = [
    [
      booking.name,
      booking.phone,
      booking.service,
      booking.date,
      booking.time,
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}



