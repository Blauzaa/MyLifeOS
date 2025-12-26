import AIChat from "../components/AIChat";
import Sidebar from "../components/Sidebar";
import "./globals.css";
import { ModalProvider } from '../context/ModalContext'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 1. Tambahkan suppressHydrationWarning di sini
    <html lang="en" suppressHydrationWarning>
      {/* 2. Tambahkan juga di body untuk jaga-jaga */}
      <body className="bg-slate-900 text-slate-100 min-h-screen" suppressHydrationWarning>
        <ModalProvider>
           {/* Navbar, Sidebar, dll ada di sini */}
           {children}
        </ModalProvider>
        <AIChat />
        <div className="flex">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Area Konten Utama */}
          <main className="flex-1 md:ml-64 pb-24 md:pb-8 transition-all">
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}