import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { TrpcProvider } from "@/components/trpc-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { getDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";
import { APP_NAME } from "@/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// generateMetadata (instead of a fixed `metadata` object) because the
// description depends on the visitor's language.
export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return {
    // "template" is applied to the title of every child page that sets
    // one: e.g. the company profile becomes "Rossi Impianti · TrovArtigiano".
    title: {
      default: APP_NAME,
      template: `%s · ${APP_NAME}`,
    },
    description: dict.metadata.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, dict } = await getDictionary();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale} dict={dict}>
          <TrpcProvider>
            <NavBar />
            <div className="flex-1">{children}</div>
            <footer className="border-t border-border py-6 text-center text-sm text-muted">
              {format(dict.common.footer, { app: APP_NAME })}
            </footer>
          </TrpcProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
