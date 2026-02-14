const fallbackSiteUrl = 'http://localhost:3000';

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? fallbackSiteUrl;
  try {
    return new URL(raw).toString().replace(/\/$/, '');
  } catch {
    return fallbackSiteUrl;
  }
}

export const BRAND = {
  ownerName: 'Alireza Safaei',
  masterBrandName: 'ASDEV',
  productName: 'Family ROSCA',
  productNameFa: 'صندوق خانوادگی',
  positioningEn:
    'Family ROSCA by ASDEV delivers transparent, non-custodial ROSCA workflows for families and trusted communities.',
  positioningFa:
    'Family ROSCA محصول ASDEV برای مدیریت شفاف و غیرامانی صندوق های خانوادگی و گروه های مورد اعتماد است.',
  siteUrl: resolveSiteUrl(),
  primaryContactPath: '/',
};
