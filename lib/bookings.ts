// lib/bookings.ts

import { db } from "@/lib/firebaseAdmin";
import { appendBookingRow } from "@/lib/googleSheets";

export type BookingInput = {
  businessId: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
};

export async function saveBooking(input: BookingInput) {
  const { businessId, name, phone, service, date, time } = input;

  if (!db) {
    throw new Error("Firestore DB is not initialized.");
  }

  // Save to Firestore
  const bookingRef = db.collection("bookings").doc();
  await bookingRef.set({
    businessId,
    name,
    phone,
    service,
    date,
    time,
    createdAt: new Date(),
  });

  // Save to Google Sheet
  await appendBookingRow({
    businessId,
    name,
    phone,
    service,
    date,
    time,
    status: "booked",
  });

  return bookingRef.id;
}

