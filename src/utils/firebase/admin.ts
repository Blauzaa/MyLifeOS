// Contoh isi file utils/firebase/admin.ts yang baru dan aman dari error build:
import admin from 'firebase-admin';

function initFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // .replace(/\\n/g, '\n') sangat penting untuk Vercel agar baris baru privat key terbaca benar
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}

// Ekspor fungsi getter untuk mendapatkan instance DB dan Auth secara dinamis saat runtime
export const getAdminDb = () => {
  initFirebaseAdmin();
  return admin.firestore();
};

export const getAdminAuth = () => {
  initFirebaseAdmin();
  return admin.auth();
};
