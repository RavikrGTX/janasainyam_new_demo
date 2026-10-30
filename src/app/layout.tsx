import type { Metadata } from "next";
import { Noto_Sans_Telugu, Noto_Serif_Telugu, Inter } from "next/font/google";
import "./globals.css";

const notoSansTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-telugu-sans",
  display: "swap",
});

const notoSerifTelugu = Noto_Serif_Telugu({
  subsets: ["telugu"],
  weight: ["400", "600", "700"],
  variable: "--font-telugu-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "జనసైన్యం | Janasainyam - Telugu Daily Newspaper & E-Paper",
  description:
    "జనసైన్యం దినపత్రిక మరియు ఇ-పేపర్ - నిజమైన ప్రజా గళం. విశ్వసనీయ వార్తలు, విశ్లేషణలు, ఈ-పేపర్ ఎడిషన్.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="te"
      className={`${notoSansTelugu.variable} ${notoSerifTelugu.variable} ${inter.variable} antialiased`}
    >
      <body className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
