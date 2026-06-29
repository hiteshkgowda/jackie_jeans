import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jackie Jeans — Smart Fit",
  description: "Find jeans that actually fit with our AI-powered fit quiz.",
};

// viewport-fit=cover lets content extend under the iOS notch/home-indicator,
// enabling env(safe-area-inset-*) to provide precise padding.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-brand-bg font-sans">
        {children}
      </body>
    </html>
  );
}
