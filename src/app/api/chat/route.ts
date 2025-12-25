/* eslint-disable @typescript-eslint/no-explicit-any */
import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { createClient } from '../../../utils/supabase/supabaseClient'; 
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // PAKSA: Gunakan (streamText as any) untuk melewati validasi overload
    const result = await (streamText as any)({
      model: groq('llama-3.1-8b-instant') as any,
      messages,
      system: `Anda adalah asisten LifeOS cerdas. User ID: ${user?.id ?? 'unknown'}`,
      tools: {
        addTask: (tool as any)({
          description: 'Menambahkan tugas baru ke daftar task',
          parameters: z.object({
            title: z.string(),
          }),
          execute: async ({ title }: { title: string }) => {
            if (!user) return 'Error: Login dulu';
            await supabase.from('tasks').insert({ title, user_id: user.id, status: 'todo' });
            return `Task "${title}" sukses ditambahkan!`;
          },
        }),
        deleteTask: (tool as any)({
          description: 'Menghapus tugas berdasarkan kata kunci',
          parameters: z.object({
            keyword: z.string(),
          }),
          execute: async ({ keyword }: { keyword: string }) => {
            if (!user) return 'Error: Login dulu';
            await supabase.from('tasks').delete().ilike('title', `%${keyword}%`).eq('user_id', user.id);
            return `Tugas "${keyword}" sudah dihapus!`;
          },
        }),
      },
      maxSteps: 5,
    });

    // PAKSA: Cast result ke any agar toDataStreamResponse tidak merah
    return (result as any).toDataStreamResponse();
  } catch (e) {
    console.error(e);
    return new Response('AI Error', { status: 500 });
  }
}