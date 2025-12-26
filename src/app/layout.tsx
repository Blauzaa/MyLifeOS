import AIChat from "../components/AIChat";
import Sidebar from "../components/Sidebar";
import "./globals.css";
import { ModalProvider } from '../context/ModalContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-900 text-slate-100 min-h-screen" suppressHydrationWarning>
        
        {/* ✅ BUKA PROVIDER DI SINI (SETELAH BODY) */}
        <ModalProvider>
        
            <AIChat />
            
            <div className="flex">
              {/* Sidebar */}
              <Sidebar />
              
              {/* Area Konten Utama */}
              <main className="flex-1 md:ml-64 pb-24 md:pb-8 transition-all">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                  {/* Di sinilah TasksPage dirender. Karena sekarang sudah di dalam ModalProvider, error akan hilang. */}
                  {children}
                </div>
              </main>
            </div>

        {/* ✅ TUTUP PROVIDER DI SINI (SEBELUM TUTUP BODY) */}
        </ModalProvider>

      </body>
    </html>
  );
}