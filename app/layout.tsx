import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WhatsAppChat } from "./components/whatsapp-chat";
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
  title: {
    default: "LogiTrust | Delivery Management",
    template: "%s | LogiTrust",
  },
  description: "LogiTrust dashboard for managing orders, riders, and live tracking.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_45%,#e0f2fe_100%)] text-slate-900">
        {children}
        <WhatsAppChat />
      </body>
    </html>
  );
}
