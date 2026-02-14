import { describe, expect, test } from 'bun:test';
import { BRAND } from '../brand';
import sitemap from '../../app/sitemap';
import robots from '../../app/robots';

describe('brand and seo contract', () => {
  test('brand identity baseline is defined', () => {
    expect(BRAND.ownerName).toBe('Alireza Safaei');
    expect(BRAND.masterBrandName).toBe('ASDEV');
    expect(BRAND.productName).toBe('Family ROSCA');
    expect(BRAND.siteUrl.startsWith('http')).toBe(true);
  });

  test('sitemap includes homepage and brand page', () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`${BRAND.siteUrl}/`);
    expect(urls).toContain(`${BRAND.siteUrl}/brand`);
  });

  test('robots points to canonical host and sitemap', () => {
    const spec = robots();
    expect(spec.host).toBe(BRAND.siteUrl);
    expect(spec.sitemap).toBe(`${BRAND.siteUrl}/sitemap.xml`);
  });
});
