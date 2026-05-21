import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/lib/use-theme";
import FrontendUsageTracker from "@/components/analytics/FrontendUsageTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
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
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${inter.variable} antialiased`}
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
