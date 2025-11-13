import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/Provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
    default: "Employee Profile Management System",
    template: "%s | EmployeeHub",
  },
  description: "Streamline your HR processes with secure, role-based employee management. Handle profiles, feedback, and absence requests all in one place.",
  keywords: ["employee management", "HR software", "profile management", "feedback system", "absence tracking"],
  authors: [{ name: "EmployeeHub" }],
  creator: "EmployeeHub",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Employee Profile Management System",
    description: "Streamline your HR processes with secure, role-based employee management.",
    siteName: "EmployeeHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Employee Profile Management System",
    description: "Streamline your HR processes with secure, role-based employee management.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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
        <ErrorBoundary level="app">
          <TRPCProvider>{children}</TRPCProvider>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
