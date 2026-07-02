import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

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
    <html lang="zh-CN" className="dark h-full">
      <body className="h-full bg-zinc-950 text-zinc-100 antialiased">
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
