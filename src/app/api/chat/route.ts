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
      5. ACTIONS: Navigate the app. Keywords: "focus mode", "open calendar", "buka finance".

      LANGUAGE:
      - Understand English, Indonesian, and mixed (Jaksel/Sunda/Javanese slang ok).
      - Be smart: "Beli kopi 25rb" -> Finance (Expense, 25000, "Beli kopi").
      - "Meeting besok jam 10" -> Calendar (Event, Tomorrow's date, 10:00).
      
      RULES:
      - If amount is mentioned (e.g., 50k, 50.000), interpret as FINANCE unless clearly a task.
      - If "Focus" mentioned, use triggerAction('start_focus').
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
            const { error } = await supabase.from('tasks').insert({ title, status, priority, user_id: user.id });
            return error ? `Error: ${error.message}` : `✅ Task created: "${title}"`;
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
            const { error } = await supabase.from('finances').insert({ title, amount, type, user_id: user.id });
            return error ? `Error: ${error.message}` : `💰 ${type === 'income' ? 'Income' : 'Expense'} recorded: ${title} (Rp ${amount})`;
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
            const { error } = await supabase.from('notes').insert({ title, content, user_id: user.id });
            return error ? `Error: ${error.message}` : `📝 Note saved: "${title}"`;
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
            const { error } = await supabase.from('events').insert({ title, event_date, start_time, end_time, user_id: user.id });
            return error ? `Error: ${error.message}` : `📅 Event scheduled: "${title}" on ${event_date}`;
          }
        }),
        triggerAction: tool({
          description: 'Trigger client-side navigation or special mode',
          parameters: z.object({
            action: z.enum(['start_focus', 'open_finance', 'open_calendar', 'open_tasks', 'open_notes']).describe('The action to perform')
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