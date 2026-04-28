import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MigrateAI — AI-Powered Code Migration",
  description:
    "Stop doing boring upgrades. Let AI migrate your codebase automatically. Support for React, Jest, CommonJS, Python, REST, and Tailwind migrations.",
  keywords: [
    "code migration",
    "AI",
    "React upgrade",
    "codemod",
    "automated migration",
    "MigrateAI",
  ],
  openGraph: {
    title: "MigrateAI — AI-Powered Code Migration",
    description: "Stop doing boring upgrades. Let AI migrate your codebase automatically.",
    type: "website",
  },
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased font-sans">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
