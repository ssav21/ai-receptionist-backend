// lib/firebaseAdmin.ts
import admin from "firebase-admin";

if (!admin.apps.length) {
  // Support both naming styles so it works with your existing env vars
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.PROJECT_ID;
  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL;
  const privateKey = (
    process.env.FIREBASE_PRIVATE_KEY || process.env.PRIVATE_KEY
  )?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "[firebaseAdmin] Missing Firebase env vars. Firestore will NOT work.",
      { projectIdPresent: !!projectId, clientEmailPresent: !!clientEmail }
    );
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

// Firestore instance (or null if not initialised)
export const db = admin.apps.length ? admin.firestore() : null;

// Export admin so other files can use FieldValue, etc.
export { admin };

