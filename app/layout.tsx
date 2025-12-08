import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalHeader } from "@/components/global-header";
import { LocalFileSystemProvider } from "@/components/local-files-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sheetlife Views",
  description: "Explore storages and files powered by the Sheetlife Core API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LocalFileSystemProvider>
          <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <GlobalHeader />
            {children}
          </div>
        </LocalFileSystemProvider>
      </body>
    </html>
  );
}
