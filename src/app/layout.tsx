import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Personal Portal",
  description: "Human 3.0 — Personal Management Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`dark h-full ${jetbrainsMono.variable}`}>
      <body className="h-full bg-background text-foreground antialiased">
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
