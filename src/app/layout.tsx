import type { Metadata } from "next";
import Sidebar from "../components/Sidebar"; // Import Sidebar
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeOS Dashboard",
  description: "Personal Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 min-h-screen">
        <div className="flex">
          {/* Sidebar nempel kiri */}
          <Sidebar />
          
          {/* Konten Utama (Geser 64 unit di desktop biar gak ketutupan sidebar) */}
          <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen">
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}