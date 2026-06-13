import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.GITHUB_PAT;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing GITHUB_PAT in environment variables' }, 
        { status: 401 }
      );
    }

    // Memanggil API GitHub menggunakan kredensial Token (mengambil public & private)
    const res = await fetch('https://api.github.com/user/repos?visibility=all&affiliation=owner&sort=updated&per_page=100', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      // Menonaktifkan cache sementara agar selalu mendapat data terbaru dari GitHub
      cache: 'no-store' 
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch from GitHub' }, 
        { status: res.status }
      );
    }

    const repos = await res.json();
    return NextResponse.json(repos);
  } catch (error: any) {
    console.error('Server GitHub Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}