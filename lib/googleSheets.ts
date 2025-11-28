import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_TAB = "Bookings"; // Change to your tab name

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
  scopes: SCOPES,
});

const sheets = google.sheets("v4");

// 👇 EDIT THESE INDEXES TO MATCH YOUR GOOGLE SHEET COLUMNS
// If A=0, B=1, C=2, …
export const COLUMN_INDEXES = {
  name: 0,       // Column A
  phone: 1,      // Column B
  service: 2,    // Column C
  date: 3,       // Column D
  time: 4,       // Column E
};

// 👇 This is the range the assistant will READ from to check double bookings
export const READ_RANGE = `${SHEET_TAB}!A:E`;

// 👇 This is where NEW bookings will be APPENDED
export const WRITE_RANGE = `${SHEET_TAB}!A:E`;

// 🔍 CHECK IF A TIME SLOT IS TAKEN
export async function isSlotTaken(date: string, time: string) {
  const client = await auth.getClient();

  const response = await sheets.spreadsheets.values.get({
    auth: client,
    spreadsheetId: process.env.GOOGLE_SHEETS_ID!,
    range: READ_RANGE,
  });

  const rows = response.data.values || [];

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const rowDate = row[COLUMN_INDEXES.date];
    const rowTime = row[COLUMN_INDEXES.time];

    if (rowDate === date && rowTime === time) {
      return true;
    }
  }

  return false;
}

// ✍️ WRITE BOOKING INTO GOOGLE SHEET
export async function appendBookingRow(booking: {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
}) {
  const client = await auth.getClient();

  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId: process.env.GOOGLE_SHEETS_ID!,
    range: WRITE_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          booking.name,
          booking.phone,
          booking.service,
          booking.date,
          booking.time,
        ],
      ],
    },
  });

  return true;
}


