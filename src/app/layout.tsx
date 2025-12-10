import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HLExtras - Professional GHL Tools for Agencies",
    template: "%s | HLExtras",
  },
  description: "Professional GoHighLevel extensions for agencies. Clone pages, add contact buttons, embed maps, and more. Save hours with our GHL page cloning tool.",
  keywords: ["GoHighLevel", "GHL", "page cloner", "funnel cloner", "GHL tools", "agency tools", "GoHighLevel extensions", "GHL page copy", "clone GHL pages"],
  authors: [{ name: "HLExtras" }],
  creator: "HLExtras",
  publisher: "HLExtras",
  metadataBase: new URL("https://hlextras.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hlextras.com",
    siteName: "HLExtras",
    title: "HLExtras - Professional GHL Tools for Agencies",
    description: "Professional GoHighLevel extensions for agencies. Clone pages, add contact buttons, embed maps, and more. Save hours with our GHL page cloning tool.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HLExtras - Professional GHL Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HLExtras - Professional GHL Tools for Agencies",
    description: "Professional GoHighLevel extensions for agencies. Clone pages, add contact buttons, embed maps, and more.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
