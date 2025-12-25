/* eslint-disable @typescript-eslint/no-explicit-any */
import { groq } from '@ai-sdk/groq'
import { streamText, tool } from 'ai'
import { createClient } from '../../../utils/supabase/supabaseClient'
import { z } from 'zod'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const result = await streamText({
      // 🔑 TAMBAHKAN 'as any' DI SINI
      // Ini memberitahu TS untuk mengabaikan perbedaan standar V3 vs V1
      model: groq('llama-3.3-70b-versatile') as any,
      messages,
      system: `Anda adalah asisten LifeOS. User ID: ${user?.id ?? 'unknown'}`,

      tools: {
        addTask: tool({
          description: 'Menambahkan tugas baru',
          parameters: z.object({
            title: z.string(),
          }),
          execute: async ({ title }: { title: string }) => {
            if (!user) return 'Anda harus login'
            await supabase.from('tasks').insert({
              title,
              user_id: user.id,
              status: 'todo',
            })
            return `Task "${title}" berhasil ditambahkan`
          },
        }),

        deleteTask: tool({
          description: 'Menghapus task',
          parameters: z.object({
            keyword: z.string(),
          }),
          execute: async ({ keyword }: { keyword: string }) => {
            if (!user) return 'Anda harus login'
            await supabase
              .from('tasks')
              .delete()
              .ilike('title', `%${keyword}%`)
              .eq('user_id', user.id)
            return `Task "${keyword}" dihapus`
          },
        }),
      } as any, 
    })

    // 💡 REKOMENDASI: Gunakan toDataStreamResponse() jika tersedia di versi ai@3 Anda
    // Jika masih error di VS Code, biarkan toTextStreamResponse()
    return result.toDataStreamResponse()
  } catch (e) {
    console.error(e)
    return new Response('AI error', { status: 500 })
  }
}