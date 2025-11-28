// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, admin } from "@/lib/firebaseAdmin";
import twilio from "twilio";
import { isSlotTaken, appendBookingRow } from "@/lib/googleSheets";

type IncomingPayload = {
  message?: string;
  from?: string;
  assistant?: string;
  businessId?: string;
  customerName?: string;
  service?: string;
  requestedDate?: string;
  requestedTime?: string;
};

// Twilio config
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_SMS_FROM;
const ownerPhone = process.env.OWNER_PHONE;

const twilioClient =
  twilioSid && twilioAuth ? twilio(twilioSid, twilioAuth) : null;

export async function POST(req: NextRequest) {
  let body: IncomingPayload | null = null;

  try {
    body = (await req.json()) as IncomingPayload;
  } catch (err) {
    console.error("Failed to parse JSON body:", err);
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  console.log("Incoming Vapi /api/messages POST:", body);

  const {
    message,
    from,
    assistant,
    businessId = "unknown",
    customerName = "Unknown",
    service = "Unspecified",
    requestedDate = "",
    requestedTime = "",
  } = body || {};

  if (!message || !from) {
    return NextResponse.json(
      { ok: false, error: "Missing 'message' or 'from' in body" },
      { status: 400 }
    );
  }

  // 1) Check Google Sheet to avoid double booking
  let bookingStatus: "booked" | "conflict" | "no_date_time" = "no_date_time";
  let slotTaken = false;

  if (requestedDate && requestedTime) {
    try {
      slotTaken = await isSlotTaken(requestedDate, requestedTime);
      bookingStatus = slotTaken ? "conflict" : "booked";
    } catch (err) {
      console.error("Error checking slot in Google Sheets:", err);
      bookingStatus = "booked"; // if check fails, still book
    }
  }

  // 2) Save to Firestore
  let bookingId: string | null = null;

  if (db) {
    try {
      const docRef = await db.collection("bookings").add({
        businessId,
        callerPhone: from,
        rawMessage: message,
        assistantName: assistant || "unknown",
        customerName,
        service,
        requestedDate,
        requestedTime,
        status: bookingStatus, // booked | conflict | no_date_time
        source: "vapi-phone",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      bookingId = docRef.id;
      console.log("Saved booking to Firestore with ID:", bookingId);
    } catch (err) {
      console.error("Error saving booking to Firestore:", err);
    }
  }

  // 3) If slot is free, append to Google Sheet
  if (!slotTaken && requestedDate && requestedTime) {
    try {
      await appendBookingRow({
        businessId,
        name: customerName,
        phone: from,
        service,
        date: requestedDate,
        time: requestedTime,
        status: bookingStatus,
      });
    } catch (err) {
      console.error("Error appending booking to Google Sheet:", err);
    }
  } else if (slotTaken) {
    console.log(
      `Slot conflict detected for ${requestedDate} ${requestedTime} – not appending to sheet.`
    );
  }

  // 4) SMS notifications
  if (twilioClient && twilioFrom && ownerPhone) {
    try {
      const baseText =
        `Booking status: ${bookingStatus.toUpperCase()}\n` +
        `Business: ${businessId}\n` +
        `Name: ${customerName}\n` +
        `Phone: ${from}\n` +
        `Service: ${service}\n` +
        `When: ${requestedDate || "?"} ${requestedTime || ""}\n` +
        `Message: "${message}"`;

      await twilioClient.messages.create({
        from: twilioFrom,
        to: ownerPhone,
        body: baseText,
      });

      if (!slotTaken) {
        await twilioClient.messages.create({
          from: twilioFrom,
          to: from,
          body:
            "Hi, this is South Yarra Hair Salon. We've received your booking request" +
            (requestedDate && requestedTime
              ? ` for ${requestedDate} at ${requestedTime}`
              : "") +
            " and will confirm your appointment time shortly. Thank you!",
        });
      }

      console.log("SMS notifications sent successfully.");
    } catch (err) {
      console.error("Error sending SMS via Twilio:", err);
    }
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Booking request processed",
      bookingId,
      bookingStatus,
      slotTaken,
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: "GET /api/messages reached successfully",
    },
    { status: 200 }
  );
}



