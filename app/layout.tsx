import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { TrpcProvider } from "@/components/trpc-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // "template" is applied to the title of every child page that sets
  // one: e.g. the company profile becomes "Rossi Impianti · Artigiani Directory".
  title: {
    default: "Artigiani Directory",
    template: "%s · Artigiani Directory",
  },
  description:
    "Find local companies and tradespeople, request a quote and read reviews.",
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
      <body className="min-h-full flex flex-col">
        <TrpcProvider>
          <NavBar />
          {children}
        </TrpcProvider>
      </body>
    </html>
  );
}
