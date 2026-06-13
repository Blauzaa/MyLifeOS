import admin from 'firebase-admin';

function initFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        // Menggunakan fallback jika salah satu variable lingkungan kosong
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}

export const getAdminDb = () => {
  initFirebaseAdmin();
  return admin.firestore();
};

export const getAdminAuth = () => {
  initFirebaseAdmin();
  return admin.auth();
};