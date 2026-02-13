import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "صندوق خانوادگی | Family ROSCA",
  description: "سیستم مدیریت صندوق‌های قرض‌الحسنه خانوادگی و دوستانه - غیرامانی و شفاف",
  keywords: ["صندوق", "ROSCA", "قرض‌الحسنه", "خانواده", "پس‌انداز", "صندوق خانوادگی"],
  authors: [{ name: "ROSCA Platform" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "صندوق خانوادگی | Family ROSCA",
    description: "سیستم مدیریت صندوق‌های قرض‌الحسنه خانوادگی و دوستانه",
    type: "website",
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
