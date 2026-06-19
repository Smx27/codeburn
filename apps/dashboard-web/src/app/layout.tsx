import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
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
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "AIInsight - AI Usage Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIInsight - AI Usage Intelligence for Engineering Teams",
    description:
      "Track AI usage across Claude, Codex, Gemini, Cursor, OpenCode and more.",
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('aiinsight_theme');
                  var dark = theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.classList.add(dark ? 'dark' : 'light');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
