/* eslint-disable @typescript-eslint/no-explicit-any */
import { groq } from '@ai-sdk/groq'
import * as ai from 'ai' // Kita import sebagai namespace untuk hindari konflik nama
import { createClient } from '../../../utils/supabase/supabaseClient'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: Request) {
    console.log(">>> API CHAT DIPANGGIL! <<<");
  try {
    const { messages } = await req.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 🔑 PAKSA: Ambil fungsi tool dan streamText, lalu cast ke 'any'
    const toolHelper = (ai as any).tool
    const streamTextHelper = (ai as any).streamText

    const result = await streamTextHelper({
      model: groq('llama-3.1-8b-instant') as any,
      messages,
      system: `Anda adalah asisten LifeOS yang cerdas. User ID: ${user?.id ?? 'unknown'}`,
      tools: {
        addTask: toolHelper({
          description: 'Menambahkan tugas baru ke daftar task',
          parameters: z.object({
            title: z.string(),
          }),
          execute: async ({ title }: { title: string }) => {
            if (!user) return 'Error: User belum login'
            await supabase.from('tasks').insert({
              title,
              user_id: user.id,
              status: 'todo',
            })
            return `Task "${title}" berhasil ditambahkan ke database.`
          },
        }),
        deleteTask: toolHelper({
          description: 'Menghapus tugas berdasarkan kata kunci',
          parameters: z.object({
            keyword: z.string(),
          }),
          execute: async ({ keyword }: { keyword: string }) => {
            if (!user) return 'Error: User belum login'
            await supabase
              .from('tasks')
              .delete()
              .ilike('title', `%${keyword}%`)
              .eq('user_id', user.id)
            return `Tugas yang mengandung "${keyword}" telah dihapus.`
          },
        }),
      },
      maxSteps: 5,
    })

    // Gunakan method yang tersedia (toDataStreamResponse atau toTextStreamResponse)
    // Cast ke any agar TS tidak komplain method tidak ada
    return (result as any).toDataStreamResponse()
  } catch (e) {
    console.error('AI Error Detail:', e)
    return new Response('Terjadi kesalahan pada sistem AI', { status: 500 })
  }
}