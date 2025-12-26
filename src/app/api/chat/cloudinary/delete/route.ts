import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary di server side
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, // Tambahkan ini di .env.local
  api_secret: process.env.CLOUDINARY_API_SECRET, // Tambahkan ini di .env.local
});

export async function POST(request: Request) {
  try {
    const { public_id } = await request.json();

    if (!public_id) {
      return NextResponse.json({ error: 'Public ID required' }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(public_id);
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}