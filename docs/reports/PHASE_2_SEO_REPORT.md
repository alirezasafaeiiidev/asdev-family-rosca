# گزارش فاز ۲ سئو — Family ROSCA

- تاریخ: 2026-02-14
- مخزن: `asdev-family-rosca`
- وضعیت: تکمیل‌شده (دامنه اجرای محلی)

## خروجی‌های انجام‌شده

- تعریف metadata پایه و canonical در:
  - `src/app/layout.tsx`
- افزودن مسیرهای فنی سئو:
  - `src/app/sitemap.ts`
  - `src/app/robots.ts`
- افزودن صفحه برند ایندکس‌پذیر:
  - `src/app/brand/page.tsx`
- تست قراردادی سئو/برند:
  - `src/lib/__tests__/brand-seo-contract.test.ts`

## اعتبارسنجی

- `bun run lint` پاس
- `bun run test` پاس
- `bun run build` پاس

## موارد باقیمانده

- اتصال دامنه نهایی production و ثبت sitemap در Search Console/Bing.
