import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Niriksh - AI Token Usage Intelligence",
  description:
    "Track AI token usage across every provider, every model, every engineer. Real-time cost intelligence for teams that take AI seriously.",
  keywords: [
    "AI token tracking",
    "LLM cost monitoring",
    "AI usage analytics",
    "OpenAI costs",
    "Anthropic costs",
    "AI budget management",
    "token usage dashboard",
  ],
  openGraph: {
    title: "Niriksh - AI Token Usage Intelligence",
    description:
      "Track AI token usage across every provider, every model, every engineer. Real-time cost intelligence.",
    type: "website",
    siteName: "Niriksh",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Niriksh - AI Token Usage Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Niriksh - AI Token Usage Intelligence",
    description:
      "Track AI token usage across every provider, every model, every engineer.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable}`}>
      <body className="font-sora antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
