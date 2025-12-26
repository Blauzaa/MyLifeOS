import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { public_id } = await req.json();

        if (!public_id) {
            return NextResponse.json({ error: 'Public ID required' }, { status: 400 });
        }

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            return NextResponse.json({ error: 'Missing Cloudinary Config' }, { status: 500 });
        }

        // Generate Signature
        const timestamp = Math.round((new Date).getTime() / 1000);
        const signature = crypto.createHash('sha1')
            .update(`public_id=${public_id}&timestamp=${timestamp}${apiSecret}`)
            .digest('hex');

        // Call Cloudinary API
        const formData = new FormData();
        formData.append('public_id', public_id);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
            method: 'POST',
            body: formData
        });

        const result = await res.json();
        return NextResponse.json(result);

    } catch (error) {
        console.error('Cloudinary Delete Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
