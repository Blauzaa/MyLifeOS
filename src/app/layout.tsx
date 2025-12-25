import Sidebar from "../components/Sidebar";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 min-h-screen">
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