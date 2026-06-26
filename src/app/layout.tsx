import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "영업관리 프로그램",
  description: "고객 및 미팅 내역을 관리하는 프로그램",
};

import { cookies } from "next/headers";
import LogoutButton from "./LogoutButton";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("is_logged_in")?.value === "true";

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {isLoggedIn && (
          <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-secondary)' }}>
            <LogoutButton />
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
