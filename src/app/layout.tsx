import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "صقر | تتبع وفهم بياناتك في محركات الإجابة",
  description: "صقر يمنحك الرؤية الكاملة لكيفية ظهور بياناتك في محركات الإجابة (AEO). تتبع دقيق للسوق السعودي وفهم عميق للبيانات.",
  themeColor: "#ffffff",
};

import { AuthProvider } from "@/components/auth-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${ibmPlexArabic.variable} font-[family-name:var(--font-ibm-plex-arabic)] antialiased bg-white text-black`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
