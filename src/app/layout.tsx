import type { Metadata, Viewport } from "next";
import { Mali, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-noto-thai",
  display: "swap",
});

const mali = Mali({
  subsets: ["thai", "latin"],
  variable: "--font-mali",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KhuiDeep คุยดีพ",
  description: "เว็บการ์ดคำถามภาษาไทยสำหรับบทสนทนาเชิงลึก",
  applicationName: "KhuiDeep",
};

export const viewport: Viewport = {
  themeColor: "#fffdf7",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${notoThai.variable} ${mali.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
