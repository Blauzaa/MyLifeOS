import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { z } from 'zod';
// Import dari file SERVER (Langkah 1B)
import { createClient } from '../../../utils/supabase/server'; 

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Init Supabase di Server
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      messages,
      system: `Kamu asisten LifeOS. User ID: ${user?.id ?? 'Guest'}.`,
      maxSteps: 5, // Mengizinkan AI berpikir beberapa langkah (multi-step)
      tools: {
        addTask: tool({
          description: 'Catat tugas baru ke database',
          parameters: z.object({
            title: z.string().describe('Judul tugas'),
          }),
          execute: async ({ title }) => {
            // Logic database aman di sini karena berjalan di server
            if (!user) return 'Gagal: Harap login dahulu.';
            
            const { error } = await supabase
              .from('tasks')
              .insert({ title, user_id: user.id, status: 'todo' });

            return error ? `Error: ${error.message}` : `Berhasil mencatat: "${title}"`;
          },
        }),
      },
    });

    // Return format data stream terbaru
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}