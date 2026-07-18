import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import RegisterServiceWorker from "./register-sw";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noter",
  description: "A simple note-taking app for text and image notes.",
  appleWebApp: {
    // "default" renders iOS's plain grey status bar. "black-translucent"
    // makes the status bar transparent instead, so whatever we render at
    // the very top of the page (the fixed purple strip in <body> below)
    // shows through behind the clock/battery icons.
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Noter",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
  // Required for iOS to extend page content under the status bar/notch at
  // all - without it, env(safe-area-inset-top) is always 0 and the
  // black-translucent status bar has nothing to show through to.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div
          aria-hidden
          className="fixed inset-x-0 top-0 z-50 bg-indigo-600"
          style={{ height: "env(safe-area-inset-top)" }}
        />
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
