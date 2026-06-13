import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../utils/firebase/admin';
import admin from 'firebase-admin';

export async function GET(request: Request) {
  try {
    // 1. Ambil seluruh data proyek tanpa memicu error indeks Firestore
    const snapshot = await getAdminDb().collection('projects').get();

    // 2. Lakukan filter 'is_published' dan sort 'created_at' langsung di memori server
    const projects = snapshot.docs
      .map((doc: admin.firestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          tech_stack: data.tech_stack || [],
          github_url: data.github_url || '',
          demo_url: data.demo_url || '',
          cover_url: data.cover_url || '',
          is_published: data.is_published ?? false,
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : new Date().toISOString()
        };
      })
      // Saring hanya proyek yang di-publish
      .filter(project => project.is_published === true)
      // Urutkan berdasarkan tanggal terbaru
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}