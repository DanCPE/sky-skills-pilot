import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/lib/use-theme";
import FrontendUsageTracker from "@/components/analytics/FrontendUsageTracker";

const inter = Inter({
  display: "swap",
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sky Skills",
  description: "Cognitive skills practice platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${inter.className} antialiased`}
      >
        <ThemeProvider>
          <FrontendUsageTracker />
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
