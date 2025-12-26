import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AIChat from "../components/AIChat";
import Sidebar from "../components/Sidebar";

// Import kedua Provider
import { ModalProvider } from '../context/ModalContext'
import { FocusProvider } from "../context/FocusContext"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Life OS",
  description: "Productivity App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-900 text-slate-100 min-h-screen`} suppressHydrationWarning>
        
        {/* PROVIDER 1: Modal */}
        <ModalProvider>
          {/* PROVIDER 2: Focus Timer (Bungkus di dalamnya) */}
          <FocusProvider>
          
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

          </FocusProvider>
        </ModalProvider>

      </body>
    </html>
  );
}