import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Analytics from "@/components/Analytics";
import Script from "next/script";

const spaceGrotesk = Space_Grotesk({ variable: "--font-heading", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const inter = Inter({ variable: "--font-body", subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["100", "200", "300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Free ATS Score Checker & Resume Optimizer",
  description: "Sturdy AI - Free AI resume analyzer & optimizer. Check ATS score instantly. Get personalized tips to improve your resume and pass applicant tracking systems.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} antialiased`}>
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7326754333700578" crossOrigin="anonymous" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
