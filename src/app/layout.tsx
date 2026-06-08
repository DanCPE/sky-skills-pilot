import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/lib/use-theme";
import FrontendUsageTracker from "@/components/analytics/FrontendUsageTracker";
import BroadcastBand from "@/components/BroadcastBand";

const inter = Inter({
  display: "swap",
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://sky-skills.vercel.app",
  ),
  title: {
    default: "SkySkills",
    template: "%s | SkySkills",
  },
  applicationName: "SkySkills",
  description: "Cognitive skills practice platform",
  openGraph: {
    siteName: "SkySkills",
    title: "SkySkills",
    description: "Cognitive skills practice platform",
    url: "/",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
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
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "SkySkills",
                alternateName: ["Sky Skills"],
                url:
                  process.env.NEXT_PUBLIC_APP_URL ||
                  "https://sky-skills.vercel.app",
              }),
            }}
          />
          <FrontendUsageTracker />
          <Navbar />
          <BroadcastBand />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
