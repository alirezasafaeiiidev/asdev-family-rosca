import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: `برند ${BRAND.masterBrandName} | ${BRAND.productName}`,
  description:
    'معرفی برند ASDEV، اصول مهندسی Family ROSCA و مسیر همکاری برای مشاوره و پیاده سازی سیستم های وب Production-Grade.',
  alternates: {
    canonical: '/brand',
  },
};

export default function BrandPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: BRAND.ownerName,
    jobTitle: 'Production-Grade Web Systems Consultant',
    url: `${BRAND.siteUrl}/brand`,
    worksFor: {
      '@type': 'Organization',
      name: BRAND.masterBrandName,
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <section className="mx-auto max-w-4xl px-4 py-16 space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold tracking-wide text-emerald-600 dark:text-emerald-400">
            {BRAND.masterBrandName} Brand Profile
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100">
            {BRAND.productNameFa} زیر چتر برند {BRAND.masterBrandName}
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">{BRAND.positioningFa}</p>
        </header>

        <section className="rounded-2xl border border-emerald-100 bg-white/80 p-6 shadow-sm dark:border-emerald-900/40 dark:bg-gray-900/70">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">مالک برند و نقش اجرایی</h2>
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            {BRAND.ownerName} به عنوان مشاور و مجری سیستم های وب Production-Grade، طراحی معماری، سخت سازی CI/CD و ثبات عملیاتی
            این محصول را هدایت می کند.
          </p>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white/80 p-6 shadow-sm dark:border-emerald-900/40 dark:bg-gray-900/70">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">رابطه محصول با برند مادر</h2>
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            Family ROSCA یک محصول تخصصی از {BRAND.masterBrandName} است. تمرکز محصول روی شفافیت مالی، اعتماد قابل ممیزی، و اجرای
            غیرامانی برای صندوق های خانوادگی و گروهی است.
          </p>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white/80 p-6 shadow-sm dark:border-emerald-900/40 dark:bg-gray-900/70">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">مسیر همکاری</h2>
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            برای همکاری تجاری، مشاوره فنی، یا سرمایه گذاری، از مسیر ارتباطی اصلی محصول استفاده کنید.
          </p>
          <Link
            href={BRAND.primaryContactPath}
            className="inline-flex mt-4 items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            بازگشت به صفحه اصلی
          </Link>
        </section>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
