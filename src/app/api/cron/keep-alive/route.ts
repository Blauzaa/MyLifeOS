import { NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'

export async function GET() {
    try {
        // 1. Initialize Supabase Client (uses existing server config)
        // Note: This run will be unauthenticated (no user session), 
        // so it uses the Anon Key.
        const supabase = await createClient()

        // 2. Perform a lightweight query
        // PENTING: Kita hanya melakukan "SELECT" (Read), bukan "INSERT/UPDATE".
        // 
        // Supabase menghitung "Project Client Activity" berdasarkan adanya request API (baik Read maupun Write).
        // Dengan melakukan 'select' sederhana ini, kita sudah memberitahu Supabase bahwa project masih aktif
        // TANPA perlu membuat data sampah (dummy task) yang harus dihapus lagi.
        // Ini adalah cara yang paling bersih, aman, dan efisien.
        const { data, error } = await supabase.from('tasks').select('id').limit(1).maybeSingle()

        // Kita tidak peduli dengan hasil datanya (walaupun error karena RLS),
        // yang penting request sudah sampai ke Supabase.

        return NextResponse.json({
            ok: true,
            message: 'Supabase keep-alive ping successful',
            strategy: 'Read-Only (Sufficient for Keep-Alive)',
            timestamp: new Date().toISOString(),
            status: error ? 'RLS Triggered (Activity Recorded)' : 'Data Fetched'
        })

    } catch (err: any) {
        console.error('Keep-alive ping error:', err)
        return NextResponse.json(
            { ok: false, error: err.message },
            { status: 500 }
        )
    }
}
