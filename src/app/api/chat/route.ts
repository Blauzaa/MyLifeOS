import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getAdminDb, getAdminAuth } from '../../../utils/firebase/admin'; // ✅ DIUBAH: Menggunakan getter dinamis
import admin from 'firebase-admin';

export const maxDuration = 30;
export const dynamic = 'force-dynamic'; // ✅ DITAMBAHKAN: Memaksa rute agar selalu dinamis saat runtime

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Decode Firebase ID Token dari Authorization Header
    const authHeader = req.headers.get('authorization');
    let userId = 'Guest';
    let user = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decodedToken = await getAdminAuth().verifyIdToken(token); // ✅ DIUBAH: Menggunakan getAdminAuth()
        userId = decodedToken.uid;
        user = decodedToken;
      } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
      }
    }

    // Get Current Time for Context
    const now = new Date();
    const dateContext = `Current Date/Time: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`;

    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      messages,
      system: `You are the "LifeOS Controller", a highly intelligent assistant for managing the user's life.
      User ID: ${user?.id ?? 'Guest'}. 
      ${dateContext}
      
      CAPABILITIES:
      1. TASKS: Create todo items. Keywords: "do", "buy", "remind", "task", "beli", "ingetin".
      2. FINANCE: Record income/expenses. Keywords: "spent", "paid", "salary", "jajan", "bayar", "masuk", "uang".
      3. NOTES: Write thoughts/drafts. Keywords: "write", "draft", "note", "catat", "ide", "tulis".
      4. CALENDAR: Schedule events. Detect dates like "tomorrow", "next friday", "besok", "minggu depan".
      5. WATCHLIST: Add movies/series to watch using addWatchlist tool. Keywords: "watch", "nonton", "film", "series", "anime", "cinta dika", "judul".
      6. ACTIONS: Navigate the app. Keywords: "focus mode", "open calendar", "buka finance".

      LANGUAGE:
      - Understand English, Indonesian, and mixed (Jaksel/Sunda/Javanese slang ok).
      - Be smart: "Beli kopi 25rb" -> Finance (Expense, 25000, "Beli kopi").
      - "Tambahkan watchlist judul cinta dika..." -> Watchlist (Title="Cinta Dika", Type="movie").
      
      RULES:
      - If user says "watch" or "nonton", PRIORITY is WATCHLIST tool, NOT Task or Note.
      - If amount is mentioned (e.g., 50k, 50.000), interpret as FINANCE.
      `,
      maxSteps: 5,
      tools: {
        addTask: tool({
          description: 'Create a new task/todo',
          parameters: z.object({
            title: z.string().describe('Task title'),
            status: z.enum(['todo', 'doing', 'done']).default('todo'),
            priority: z.enum(['low', 'medium', 'high']).default('medium')
          }),
          execute: async ({ title, status, priority }) => {
            if (!user) return 'Error: Login required.';
            try {
              await getAdminDb().collection('tasks').add({ // ✅ DIUBAH: getAdminDb()
                title,
                status,
                priority,
                user_id: userId,
                subtasks: [],
                created_at: admin.firestore.FieldValue.serverTimestamp()
              });
              return `✅ Task created: "${title}"`;
            } catch (error: any) {
              return `Error: ${error.message}`;
            }
          },
        }),
        addFinance: tool({
          description: 'Record financial transaction (Income/Expense)',
          parameters: z.object({
            title: z.string().describe('Description of transaction'),
            amount: z.number().describe('Amount in numeric value'),
            type: z.enum(['income', 'expense']).describe('Type of transaction')
          }),
          execute: async ({ title, amount, type }) => {
            if (!user) return 'Error: Login required.';
            try {
              await getAdminDb().collection('finances').add({ // ✅ DIUBAH: getAdminDb()
                title,
                amount: Number(amount),
                type,
                user_id: userId,
                created_at: admin.firestore.FieldValue.serverTimestamp()
              });
              return `💰 ${type === 'income' ? 'Income' : 'Expense'} recorded: ${title} (Rp ${amount})`;
            } catch (error: any) {
              return `Error: ${error.message}`;
            }
          }
        }),
        addNote: tool({
          description: 'Save a text note or draft',
          parameters: z.object({
            title: z.string().describe('Title of the note'),
            content: z.string().describe('Main content of the note')
          }),
          execute: async ({ title, content }) => {
            if (!user) return 'Error: Login required.';
            try {
              await getAdminDb().collection('notes').add({ // ✅ DIUBAH: getAdminDb()
                title,
                content,
                user_id: userId,
                created_at: admin.firestore.FieldValue.serverTimestamp()
              });
              return `📝 Note saved: "${title}"`;
            } catch (error: any) {
              return `Error: ${error.message}`;
            }
          }
        }),
        addEvent: tool({
          description: 'Schedule a calendar event',
          parameters: z.object({
            title: z.string(),
            event_date: z.string().describe('YYYY-MM-DD format'),
            start_time: z.string().describe('HH:mm format'),
            end_time: z.string().describe('HH:mm format')
          }),
          execute: async ({ title, event_date, start_time, end_time }) => {
            if (!user) return 'Error: Login required.';
            try {
              await getAdminDb().collection('events').add({ // ✅ DIUBAH: getAdminDb()
                title,
                event_date,
                start_time,
                end_time,
                user_id: userId,
                created_at: admin.firestore.FieldValue.serverTimestamp()
              });
              return `📅 Event scheduled: "${title}" on ${event_date}`;
            } catch (error: any) {
              return `Error: ${error.message}`;
            }
          }
        }),
        addWatchlist: tool({
          description: 'Add movie/series to watchlist',
          parameters: z.object({
            title: z.string().describe('Title of the movie/series'),
            type: z.enum(['movie', 'series', 'anime']).default('movie'),
            status: z.enum(['plan', 'watching', 'finished']).default('plan'),
            link: z.string().optional().describe('Link to stream/info'),
            synopsis: z.string().optional().describe('Short description')
          }),
          execute: async ({ title, type, status, link, synopsis }) => {
            if (!user) return 'Error: Login required.';
            try {
              const querySnapshot = await getAdminDb().collection('watchlist') // ✅ DIUBAH: getAdminDb()
                .where('user_id', '==', userId)
                .where('status', '==', status)
                .get();
              const newPos = querySnapshot.size;

              await getAdminDb().collection('watchlist').add({ // ✅ DIUBAH: getAdminDb()
                title,
                type,
                status,
                link: link || '',
                synopsis: synopsis || '',
                user_id: userId,
                position: newPos,
                created_at: admin.firestore.FieldValue.serverTimestamp()
              });
              return `🎬 Added to Watchlist: "${title}"`;
            } catch (error: any) {
              return `Error: ${error.message}`;
            }
          }
        }),
        addResource: tool({
          description: 'Save a bookmark link or snippet',
          parameters: z.object({
            title: z.string(),
            url: z.string().describe('URL link').optional(),
            code: z.string().describe('Code snippet content').optional(),
            type: z.enum(['link', 'snippet']).default('link')
          }),
          execute: async ({ title, url, code, type }) => {
            if (!user) return 'Error: Login required.';
            try {
              if (type === 'link') {
                if (!url) return 'Error: URL is required for links.';
                await getAdminDb().collection('dynamic_items').add({ // ✅ DIUBAH: getAdminDb()
                  title,
                  url,
                  type: 'link',
                  user_id: userId,
                  created_at: admin.firestore.FieldValue.serverTimestamp()
                });
                return `🔗 Link Saved: "${title}"`;
              }

              if (type === 'snippet') {
                if (!code) return 'Error: Code content is required for snippets.';
                await getAdminDb().collection('snippets').add({ // ✅ DIUBAH: getAdminDb()
                  title,
                  code,
                  user_id: userId,
                  created_at: admin.firestore.FieldValue.serverTimestamp()
                });
                return `💻 Snippet Saved: "${title}"`;
              }

              return 'Error: Invalid resource type.';
            } catch (error: any) {
              return `Error: ${error.message}`;
            }
          }
        }),
        triggerAction: tool({
          description: 'Trigger client-side navigation or special mode',
          parameters: z.object({
            action: z.enum(['start_focus', 'open_finance', 'open_calendar', 'open_tasks', 'open_notes', 'open_resources']).describe('The action to perform')
          }),
          execute: async ({ action }) => {
            // This tool doesn't touch DB, just signals client
            return `🚀 ACTION_TRIGGERED: ${action}`;
          }
        })
      },
    });

    // Return format data stream terbaru
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
