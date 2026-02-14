import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { BRAND } from "@/lib/brand";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: {
    default: `${BRAND.productNameFa} | ${BRAND.productName}`,
    template: `%s | ${BRAND.productName}`,
  },
  description: BRAND.positioningFa,
  keywords: ["صندوق", "ROSCA", "قرض‌الحسنه", "خانواده", "پس‌انداز", "صندوق خانوادگی"],
  authors: [{ name: BRAND.ownerName }],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: `${BRAND.productNameFa} | ${BRAND.productName}`,
    description: BRAND.positioningFa,
    type: "website",
    url: BRAND.siteUrl,
    siteName: `${BRAND.productName} by ${BRAND.masterBrandName}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} font-sans antialiased bg-background text-foreground`}
        style={{ fontFamily: "var(--font-vazirmatn), 'Vazirmatn', system-ui, sans-serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
