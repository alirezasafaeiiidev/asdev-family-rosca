/**
 * Persian (Farsi) Language Utilities
 * ابزارهای زبان فارسی
 */

// فارسی کردن اعداد
const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export function toPersianNumber(num: number | string): string {
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
}

/**
 * تبدیل اعداد فارسی/عربی به انگلیسی
 */
export function toEnglishNumber(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
}

/**
 * فرمت پول به تومان
 */
export function formatToman(amount: number | string | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  return toPersianNumber(num.toLocaleString('fa-IR')) + ' تومان';
}

/**
 * فرمت پول به ریال
 */
export function formatRial(amount: number | string | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  return toPersianNumber(num.toLocaleString('fa-IR')) + ' ریال';
}

/**
 * فرمت کوتاه پول (میلیون، میلیارد)
 */
export function formatCurrencyShort(amount: number | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  
  if (num >= 1_000_000_000) {
    return toPersianNumber((num / 1_000_000_000).toFixed(1)) + ' میلیارد';
  } else if (num >= 1_000_000) {
    return toPersianNumber((num / 1_000_000).toFixed(1)) + ' میلیون';
  } else if (num >= 1_000) {
    return toPersianNumber((num / 1_000).toFixed(1)) + ' هزار';
  }
  return toPersianNumber(num);
}

/**
 * سه رقم سه رقم کردن اعداد
 */
export function formatNumber(num: number | string | bigint): string {
  const n = typeof num === 'bigint' ? Number(num) : Number(num);
  return toPersianNumber(n.toLocaleString('fa-IR'));
}

// ============================================
// تقویم شمسی (جلالی)
// ============================================

const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

const jalaliWeekDays = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'
];

const jalaliWeekDaysShort = [
  'ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'
];

/**
 * تبدیل تاریخ میلادی به شمسی
 */
export function toJalali(date: Date | string): { year: number; month: number; day: number } {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  let gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();
  
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + 
             Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  
  if (days > 365) days = (days - 1) % 365;
  
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  
  return { year: jy, month: jm, day: jd };
}

/**
 * تبدیل تاریخ شمسی به میلادی
 */
export function toGregorian(jy: number, jm: number, jd: number): Date {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  
  let days = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor((jy % 33 + 3) / 4) + 
             78 + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  
  gy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  
  const gd = days + 1;
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 
                 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  let gm = 0;
  let v = 0;
  for (gm = 0; gm < 13 && v < gd; gm++) v += sal_a[gm];
  
  const gDay = gd - sal_a[gm - 1];
  
  return new Date(gy, gm - 1, gDay);
}

/**
 * فرمت تاریخ شمسی کامل
 */
export function formatJalaliDate(date: Date | string): string {
  const jalali = toJalali(date);
  return `${toPersianNumber(jalali.day)} ${jalaliMonths[jalali.month - 1]} ${toPersianNumber(jalali.year)}`;
}

/**
 * فرمت تاریخ کوتاه شمسی
 */
export function formatJalaliShort(date: Date | string): string {
  const jalali = toJalali(date);
  return `${toPersianNumber(jalali.year)}/${toPersianNumber(jalali.month.toString().padStart(2, '0'))}/${toPersianNumber(jalali.day.toString().padStart(2, '0'))}`;
}

/**
 * فرمت تاریخ با روز هفته
 */
export function formatJalaliFull(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const weekDay = d.getDay();
  // تبدیل روز هفته میلادی به شمسی (شنبه = 0 در شمسی)
  const jalaliWeekDay = (weekDay + 1) % 7;
  
  return `${jalaliWeekDays[jalaliWeekDay]}، ${formatJalaliDate(date)}`;
}

/**
 * دریافت نام ماه شمسی
 */
export function getJalaliMonthName(month: number): string {
  return jalaliMonths[month - 1] || '';
}

/**
 * دریافت نام روز هفته
 */
export function getJalaliWeekDayName(day: number): string {
  return jalaliWeekDays[day] || '';
}

/**
 * دریافت نام کوتاه روز هفته
 */
export function getJalaliWeekDayShort(day: number): string {
  return jalaliWeekDaysShort[day] || '';
}

// ============================================
// زمان نسبی
// ============================================

/**
 * نمایش زمان نسبی (مثلاً: ۳ ساعت پیش)
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diff < 60) return 'همین الان';
  if (diff < 3600) return `${toPersianNumber(Math.floor(diff / 60))} دقیقه پیش`;
  if (diff < 86400) return `${toPersianNumber(Math.floor(diff / 3600))} ساعت پیش`;
  if (diff < 604800) return `${toPersianNumber(Math.floor(diff / 86400))} روز پیش`;
  if (diff < 2592000) return `${toPersianNumber(Math.floor(diff / 604800))} هفته پیش`;
  if (diff < 31536000) return `${toPersianNumber(Math.floor(diff / 2592000))} ماه پیش`;
  return `${toPersianNumber(Math.floor(diff / 31536000))} سال پیش`;
}

/**
 * نمایش زمان باقی‌مانده
 */
export function timeRemaining(targetDate: Date | string): string {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diff = Math.floor((target.getTime() - now.getTime()) / 1000);
  
  if (diff <= 0) return 'منقضی شده';
  if (diff < 60) return `${toPersianNumber(diff)} ثانیه`;
  if (diff < 3600) return `${toPersianNumber(Math.floor(diff / 60))} دقیقه`;
  if (diff < 86400) return `${toPersianNumber(Math.floor(diff / 3600))} ساعت`;
  if (diff < 604800) return `${toPersianNumber(Math.floor(diff / 86400))} روز`;
  if (diff < 2592000) return `${toPersianNumber(Math.floor(diff / 604800))} هفته`;
  return `${toPersianNumber(Math.floor(diff / 2592000))} ماه`;
}

// ============================================
// اعتبارسنجی
// ============================================

/**
 * اعتبارسنجی شماره موبایل ایران
 */
export function isValidIranianMobile(phone: string): boolean {
  const cleaned = toEnglishNumber(phone).replace(/\D/g, '');
  return /^09[0-9]{9}$/.test(cleaned);
}

/**
 * اعتبارسنجی کد ملی ایران
 */
export function isValidNationalCode(code: string): boolean {
  const cleaned = toEnglishNumber(code).replace(/\D/g, '');
  
  if (!/^\d{10}$/.test(cleaned)) return false;
  if (/^(\d)\1{9}$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  
  const remainder = sum % 11;
  const lastDigit = parseInt(cleaned[9]);
  
  return remainder < 2 ? lastDigit === remainder : lastDigit === 11 - remainder;
}

/**
 * اعتبارسنجی شماره شبا
 */
export function isValidSheba(sheba: string): boolean {
  const cleaned = sheba.replace(/\s/g, '').toUpperCase();
  if (!/^IR\d{24}$/.test(cleaned)) return false;
  
  // Convert IBAN to numeric
  const moved = cleaned.slice(4) + cleaned.slice(0, 4);
  let numeric = '';
  for (const char of moved) {
    numeric += char >= 'A' && char <= 'Z' ? (char.charCodeAt(0) - 55).toString() : char;
  }
  
  // Check mod 97
  let remainder = BigInt(0);
  for (const digit of numeric) {
    remainder = (remainder * BigInt(10) + BigInt(digit)) % BigInt(97);
  }
  
  return remainder === BigInt(1);
}

/**
 * فرمت شماره شبا
 */
export function formatSheba(sheba: string): string {
  const cleaned = sheba.replace(/\s/g, '').toUpperCase();
  if (cleaned.length !== 26) return sheba;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)} ${cleaned.slice(12, 16)} ${cleaned.slice(16, 20)} ${cleaned.slice(20, 24)} ${cleaned.slice(24)}`;
}

/**
 * فرمت شماره موبایل
 */
export function formatMobile(phone: string): string {
  const cleaned = toEnglishNumber(phone).replace(/\D/g, '');
  if (cleaned.length !== 11) return phone;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
}
