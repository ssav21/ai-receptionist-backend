import admin from "firebase-admin";

let app: admin.app.App | null = null;

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "[firebaseAdmin] Missing Firebase env vars – Firestore will be disabled."
    );
  } else {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
} else {
  app = admin.app();
}

export const db = app ? admin.firestore() : null;
export type FirestoreDB = admin.firestore.Firestore;