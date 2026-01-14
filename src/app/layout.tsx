// app/layout.tsx
import "./globals.css";

import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { getSessionUser } from '@/lib/session';
import Header from '@/components/main/Header';
import Footer from '@/components/main/Footer';

export const metadata: Metadata = {
  title: "DigitalNote",
  description: "마인드링",
  icons: [{ rel: "icon", url: "/img/maind.png" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const dbUser = await getSessionUser();
  
  // Transform database user to Header's expected type
  const user = dbUser ? {
    name: dbUser.name || '사용자',
    image: dbUser.avatarUrl || undefined,
  } : null;

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased font-suit">
        <Providers>
          <div className="layout-wrapper">
            <Header user={user} />
            <main>
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
