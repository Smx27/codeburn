import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AIInsight - AI Usage Intelligence for Engineering Teams",
  description:
    "Track AI usage across Claude, Codex, Gemini, Cursor, OpenCode and more. Understand costs, measure adoption, and govern AI tooling across your entire organization.",
  keywords: [
    "AI analytics",
    "AI usage tracking",
    "LLM monitoring",
    "AI cost management",
    "engineering analytics",
  ],
  openGraph: {
    title: "AIInsight - AI Usage Intelligence for Engineering Teams",
    description:
      "Track AI usage across Claude, Codex, Gemini, Cursor, OpenCode and more.",
    type: "website",
    siteName: "AIInsight",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIInsight - AI Usage Intelligence for Engineering Teams",
    description:
      "Track AI usage across Claude, Codex, Gemini, Cursor, OpenCode and more.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
