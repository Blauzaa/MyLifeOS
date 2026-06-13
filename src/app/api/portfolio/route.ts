import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../utils/firebase/admin'; // ✅ Menggunakan getAdminDb
import admin from 'firebase-admin';

export async function GET(request: Request) {
  try {
    // Ambil data proyek dari Firestore yang berstatus dipublikasikan (is_published)
    const snapshot = await getAdminDb().collection('projects') // ✅ Memanggil fungsi getAdminDb()
      .where('is_published', '==', true)
      .orderBy('created_at', 'desc')
      .get();

    // ✅ Menambahkan tipe data eksplisit (doc: admin.firestore.QueryDocumentSnapshot) untuk menghindari error ts(7006)
    const projects = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        tech_stack: data.tech_stack || [],
        github_url: data.github_url || '',
        demo_url: data.demo_url || '',
        cover_url: data.cover_url || '',
        created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : new Date().toISOString()
      };
    });

    // Kembalikan response dengan Header CORS agar bisa di-fetch oleh website MyPorto Anda di Vercel
    return NextResponse.json(projects, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch portfolio projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Handler untuk metode OPTIONS (Preflight request CORS)
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}