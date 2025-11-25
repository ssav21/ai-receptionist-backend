import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebaseAdmin";

if (!db) {
  console.warn(
    "[bookings] Firestore not initialized. Requests will return 500."
  );
}

type BookingStatus = "pending" | "confirmed" | "cancelled";

interface BookingPayload {
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  service?: string;
  preferredDate?: string; // ISO date string (YYYY-MM-DD)
  preferredTime?: string; // e.g. "14:30"
  notes?: string;
}

// ⚡ POST /api/bookings  → create a booking
export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Firestore not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars.",
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as Partial<BookingPayload>;

    // Basic validation
    if (!body.businessId || !body.name || !body.phone) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing required fields: businessId, name, phone are required.",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const bookingDoc = {
      businessId: body.businessId,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      service: body.service || null,
      preferredDate: body.preferredDate || null,
      preferredTime: body.preferredTime || null,
      notes: body.notes || null,
      status: "pending" as BookingStatus,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await db.collection("bookings").add(bookingDoc);

    return NextResponse.json(
      {
        ok: true,
        id: ref.id,
        booking: bookingDoc,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[bookings POST] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to create booking",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

// 🧪 GET /api/bookings?businessId=demo-barbershop → list recent bookings
export async function GET(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Firestore not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars.",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    let query = db.collection("bookings").orderBy("createdAt", "desc");

    if (businessId) {
      query = query.where("businessId", "==", businessId);
    }

    const snapshot = await query.limit(50).get();

    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(
      {
        ok: true,
        bookings,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[bookings GET] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch bookings",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
