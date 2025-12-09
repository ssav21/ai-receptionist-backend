// lib/firebaseAdmin.ts
import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "[firebaseAdmin] Missing Firebase Admin env vars – Firestore will NOT be initialised."
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

// If envs are missing, this will be undefined – and route.ts logs a warning instead of crashing.
export const db = admin.apps.length ? admin.firestore() : undefined;

export { admin };


