// lib/bookings.ts
import { db } from '@/lib/firebaseAdmin';
import { appendBookingToSheet } from '@/lib/googleSheets';

export type BookingInput = {
  businessId: string;
  name: string;
  phone: string;
  date: string;   // e.g. '2025-12-02'
  time: string;   // e.g. '10:30'
  service?: string;
  staffId?: string | null;
  source?: string;
};

export type BookingResult =
  | { ok: true; id: string }
  | { ok: false; code: 'SLOT_TAKEN'; message: string };

function buildSlotId(input: BookingInput) {
  // A unique ID per business + staff + date + time
  const staffPart = input.staffId || 'any';
  return `${input.businessId}__${input.date}__${input.time}__${staffPart}`;
}

export async function createBookingWithProtection(
  input: BookingInput
): Promise<BookingResult> {
  const timestamp = new Date().toISOString();
  const source = input.source ?? 'api';

  const slotId = buildSlotId(input);
  const docRef = db.collection('bookings').doc(slotId);

  // 1) Check if this slot already exists
  const existing = await docRef.get();
  if (existing.exists) {
    // Someone already booked this exact slot
    return {
      ok: false,
      code: 'SLOT_TAKEN',
      message: 'That time is already booked. Please choose another time.',
    };
  }

  // 2) Create booking in Firestore
  const bookingData = {
    businessId: input.businessId,
    name: input.name,
    phone: input.phone,
    date: input.date,
    time: input.time,
    service: input.service ?? null,
    staffId: input.staffId ?? null,
    source,
    createdAt: timestamp,
  };

  await docRef.set(bookingData);

  // 3) Mirror to Google Sheets (best-effort – if it fails, booking is still in Firestore)
  try {
    await appendBookingToSheet({
      timestamp,
      businessId: input.businessId,
      name: input.name,
      phone: input.phone,
      service: input.service,
    });
  } catch (err) {
    console.error('Error appending booking to Google Sheet:', err);
  }

  return { ok: true, id: docRef.id };
}
