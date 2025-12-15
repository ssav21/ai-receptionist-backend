// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, admin } from "@/lib/firebaseAdmin";
import twilio from "twilio";
import { appendBookingRow } from "@/lib/googleSheets";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Twilio config
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_SMS_FROM;
const ownerPhone = process.env.OWNER_PHONE;

const twilioClient =
  twilioSid && twilioAuth ? twilio(twilioSid, twilioAuth) : null;

function buildSlotId(businessId: string, date: string, time: string) {
  return `${businessId}__${date}__${time}`;
}

export async function POST(req: NextRequest) {
  let rawBody = "";
  let body: IncomingPayload = {};

  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("[/api/messages] Failed to read body as text:", err);
  }

  console.log("[/api/messages] RAW BODY:", rawBody || "<empty>");

  if (rawBody) {
    try {
      body = JSON.parse(rawBody) as IncomingPayload;
    } catch (err) {
      console.warn(
        "[/api/messages] Body not valid JSON, continuing with empty object.",
        err
      );
      body = {};
    }
  }

  console.log("[/api/messages] PARSED BODY:", body);

  const {
    message = "",
    from = "",
    assistant = "unknown",
    businessId = "default-business",
    customerName = "Unknown",
    service = "Unspecified",
    requestedDate = "",
    requestedTime = "",
  } = body || {};

  const hasFrom = Boolean(from);
  const hasMessage = Boolean(message);

  let bookingStatus: "booked" | "conflict" | "no_date_time" = "no_date_time";
  let slotTaken = false;
  let bookingId: string | null = null;
  let sheetsError: string | null = null;

  // ───────── 1) Firestore booking ─────────
  if (db) {
    try {
      if (requestedDate && requestedTime) {
        const slotId = buildSlotId(businessId, requestedDate, requestedTime);
        const docRef = db.collection("bookings").doc(slotId);
        const existing = await docRef.get();

        if (existing.exists) {
          slotTaken = true;
          bookingStatus = "conflict";
          bookingId = docRef.id;
          console.log(
            `Slot already booked for ${requestedDate} ${requestedTime} (doc ${bookingId})`
          );
        } else {
          bookingStatus = "booked";
          await docRef.set({
            businessId,
            callerPhone: from || null,
            rawMessage: message || null,
            assistantName: assistant,
            customerName,
            service,
            requestedDate,
            requestedTime,
            status: bookingStatus,
            source: "vapi-phone",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          bookingId = docRef.id;
          console.log("Saved booking to Firestore with ID:", bookingId);
        }
      } else {
        const docRef = await db.collection("bookings").add({
          businessId,
          callerPhone: from || null,
          rawMessage: message || null,
          assistantName: assistant,
          customerName,
          service,
          requestedDate,
          requestedTime,
          status: "no_date_time",
          source: "vapi-phone",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        bookingId = docRef.id;
        bookingStatus = "no_date_time";
        console.log("Saved undated booking to Firestore with ID:", bookingId);
      }
    } catch (err) {
      console.error("Error saving booking to Firestore:", err);
    }
  } else {
    console.warn("[/api/messages] Firestore DB not initialised.");
  }

  // ───────── 2) Google Sheets row ─────────
  if (!slotTaken && requestedDate && requestedTime) {
    try {
      await appendBookingRow({
        businessId,
        name: customerName,
        phone: from || "",
        service,
        date: requestedDate,
        time: requestedTime,
        status: bookingStatus,
      });
    } catch (err: any) {
      sheetsError = err?.message || String(err);
      console.error("[/api/messages] Sheets error:", sheetsError);
    }
  } else if (slotTaken) {
    console.log(
      `Slot conflict for ${requestedDate} ${requestedTime} – not appending to sheet.`
    );
  }

  // ───────── 3) Twilio SMS notifications ─────────
  if (twilioClient && twilioFrom && ownerPhone) {
    try {
      const baseText =
        `Booking status: ${bookingStatus.toUpperCase()}\n` +
        `Business: ${businessId}\n` +
        `Name: ${customerName}\n` +
        `Phone: ${from || "unknown"}\n` +
        `Service: ${service}\n` +
        `When: ${requestedDate || "?"} ${requestedTime || ""}\n` +
        `Message: "${message || ""}"`;

      await twilioClient.messages.create({
        from: twilioFrom,
        to: ownerPhone,
        body: baseText,
      });

      if (hasFrom && !slotTaken) {
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
  } else {
    console.warn("[/api/messages] Twilio not configured; skipping SMS.");
  }

  // ───────── 4) Response ─────────
  return new NextResponse(
    JSON.stringify({
      ok: true,
      message: "Booking request processed",
      bookingId,
      bookingStatus,
      slotTaken,
      hasFrom,
      hasMessage,
      sheetsOk: !sheetsError,
      sheetsError,
    }),
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function GET() {
  return new NextResponse(
    JSON.stringify({
      ok: true,
      message: "GET /api/messages reached successfully",
    }),
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    }
  );
}













