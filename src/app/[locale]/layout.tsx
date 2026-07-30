import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { AppToaster } from "@/components/app-toaster";
import { QueryProvider } from "@/components/query-provider";
import "../globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SOL - Logistik Multimoda",
  description: "Logistik Multimoda, Transparan & Berkelanjutan",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className={poppins.variable} suppressHydrationWarning>
      <body
        className={`${poppins.className} antialiased bg-gray-50`}
      >
        <QueryProvider>
          <NextIntlClientProvider messages={messages}>
            <Navbar />
            {children}
            <AppToaster />
          </NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
