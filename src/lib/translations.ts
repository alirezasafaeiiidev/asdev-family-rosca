/**
 * Persian (Farsi) Translations
 * ترجمه‌های فارسی
 */

export const fa = {
  // عمومی
  appName: 'صندوق خانوادگی',
  appDescription: 'سیستم مدیریت صندوق‌های قرض‌الحسنه خانوادگی و دوستانه',
  loading: 'در حال بارگذاری...',
  save: 'ذخیره',
  cancel: 'انصراف',
  confirm: 'تأیید',
  delete: 'حذف',
  edit: 'ویرایش',
  create: 'ایجاد',
  search: 'جستجو',
  close: 'بستن',
  back: 'بازگشت',
  next: 'بعدی',
  previous: 'قبلی',
  submit: 'ارسال',
  refresh: 'بازخوانی',
  copy: 'کپی',
  share: 'اشتراک‌گذاری',
  
  // احراز هویت
  auth: {
    login: 'ورود',
    logout: 'خروج',
    register: 'ثبت‌نام',
    phone: 'شماره موبایل',
    phonePlaceholder: '۰۹۱۲۳۴۵۶۷۸۹',
    otp: 'کد تأیید',
    otpPlaceholder: 'کد ۶ رقمی',
    sendOtp: 'دریافت کد تأیید',
    verifyOtp: 'تأیید و ورود',
    otpSent: 'کد تأیید ارسال شد',
    otpExpired: 'کد تأیید منقضی شده',
    invalidOtp: 'کد تأیید نامعتبر',
    invalidPhone: 'شماره موبایل نامعتبر',
    welcome: 'خوش آمدید',
    loginSuccess: 'ورود موفق',
    logoutSuccess: 'خروج موفق',
    accountCreated: 'حساب کاربری ایجاد شد',
  },
  
  // کاربر
  user: {
    profile: 'پروفایل',
    settings: 'تنظیمات',
    name: 'نام و نام خانوادگی',
    phone: 'شماره موبایل',
    email: 'ایمیل',
    nationalCode: 'کد ملی',
    avatar: 'تصویر پروفایل',
    language: 'زبان',
    theme: 'تم',
    trustScore: 'امتیاز اعتبار',
    memberSince: 'عضویت از',
  },
  
  // گروه
  group: {
    title: 'صندوق',
    groups: 'صندوق‌ها',
    createGroup: 'ایجاد صندوق جدید',
    groupName: 'نام صندوق',
    groupDescription: 'توضیحات',
    groupType: 'نوع صندوق',
    types: {
      FAMILY: 'خانوادگی',
      FRIENDS: 'دوستانه',
      NEIGHBORHOOD: 'همسایگی',
      WORKPLACE: 'محیط کار',
      CUSTOM: 'سفارشی',
    },
    amountPerCycle: 'مبلغ هر دوره',
    totalMembers: 'تعداد اعضا',
    cycleDuration: 'طول هر دوره',
    days: 'روز',
    status: {
      DRAFT: 'پیش‌نویس',
      ACTIVE: 'فعال',
      PAUSED: 'متوقف',
      COMPLETED: 'تکمیل شده',
      CANCELLED: 'لغو شده',
    },
    visibility: {
      PRIVATE: 'خصوصی',
      PUBLIC: 'عمومی',
      INVITE_ONLY: 'فقط با دعوت',
    },
    owner: 'مدیر صندوق',
    members: 'اعضا',
    cycles: 'دوره‌ها',
    rules: 'قوانین',
    startGroup: 'شروع صندوق',
    activateGroup: 'فعال‌سازی صندوق',
    groupFull: 'صندوق تکمیل شده',
    joinGroup: 'عضویت در صندوق',
    leaveGroup: 'خروج از صندوق',
    inviteMembers: 'دعوت اعضا',
    noGroups: 'هنوز صندوقی ندارید',
    createFirstGroup: 'اولین صندوق خود را ایجاد کنید',
  },
  
  // عضویت
  membership: {
    title: 'عضویت',
    role: {
      OWNER: 'مالک',
      ADMIN: 'مدیر',
      TREASURER: 'صندوق‌دار',
      MEMBER: 'عضو',
    },
    status: {
      PENDING: 'در انتظار',
      ACTIVE: 'فعال',
      PAUSED: 'متوقف',
      REMOVED: 'حذف شده',
      BANNED: 'مسدود',
    },
    joinDate: 'تاریخ عضویت',
    totalPaid: 'مجموع پرداختی',
    totalWon: 'مجموع برد',
  },
  
  // دوره
  cycle: {
    title: 'دوره',
    cycles: 'دوره‌ها',
    cycleNumber: 'دوره',
    dueDate: 'سررسید',
    status: {
      UPCOMING: 'در انتظار',
      OPEN: 'جاری',
      CLOSED: 'بسته شده',
      CANCELLED: 'لغو شده',
    },
    currentCycle: 'دوره جاری',
    nextCycle: 'دوره بعدی',
    completedCycles: 'دوره‌های تکمیل',
    remainingCycles: 'دوره‌های باقی‌مانده',
    contributionProgress: 'پیشرفت پرداخت‌ها',
  },
  
  // پرداخت
  contribution: {
    title: 'پرداخت',
    contributions: 'پرداخت‌ها',
    amount: 'مبلغ',
    penalty: 'جریمه',
    status: {
      PENDING: 'در انتظار',
      CONFIRMED: 'تأیید شده',
      FAILED: 'ناموفق',
      CANCELLED: 'لغو شده',
      LATE: 'تأخیری',
    },
    payNow: 'پرداخت',
    confirmPayment: 'تأیید پرداخت',
    paymentConfirmed: 'پرداخت تأیید شد',
    paymentPending: 'در انتظار تأیید',
    dueDate: 'سررسید',
    paidAt: 'تاریخ پرداخت',
    confirmedAt: 'تاریخ تأیید',
  },
  
  // قرعه‌کشی
  draw: {
    title: 'قرعه‌کشی',
    performDraw: 'انجام قرعه‌کشی',
    drawResult: 'نتیجه قرعه‌کشی',
    winner: 'برنده',
    winners: 'برندگان',
    congratulations: 'تبریک!',
    drawComplete: 'قرعه‌کشی انجام شد',
    alreadyDrawn: 'قبلاً قرعه‌کشی انجام شده',
    waitingContributions: 'منتظر تکمیل پرداخت‌ها',
    method: {
      RANDOM: 'تصادفی',
      PRIORITY: 'اولویت‌دار',
      MANUAL: 'دستی',
    },
  },
  
  // پرداخت به برنده
  payout: {
    title: 'پرداخت به برنده',
    payouts: 'پرداخت‌ها',
    amount: 'مبلغ',
    bonus: 'پاداش',
    status: {
      PENDING: 'در انتظار',
      PROCESSING: 'در حال پردازش',
      COMPLETED: 'تکمیل شده',
      FAILED: 'ناموفق',
    },
    bankName: 'نام بانک',
    accountNumber: 'شماره حساب',
    shebaNumber: 'شماره شبا',
    processPayout: 'پرداخت',
    payoutComplete: 'پرداخت انجام شد',
  },
  
  // اعلان‌ها
  notification: {
    title: 'اعلان‌ها',
    markAsRead: 'خوانده شده',
    markAllRead: 'همه خوانده شدند',
    noNotifications: 'اعلانی وجود ندارد',
    types: {
      CYCLE_DUE: 'سررسید دوره',
      DRAW_RESULT: 'نتیجه قرعه‌کشی',
      PAYMENT_CONFIRMED: 'تأیید پرداخت',
      GROUP_INVITE: 'دعوت به صندوق',
      MEMBER_JOINED: 'عضو جدید',
      PAYOUT_PROCESSED: 'پرداخت انجام شد',
    },
  },
  
  // گزارش‌ها
  report: {
    title: 'گزارش‌ها',
    summary: 'خلاصه',
    financial: 'مالی',
    activity: 'فعالیت',
    members: 'اعضا',
    export: 'خروجی',
    exportPdf: 'خروجی PDF',
    exportExcel: 'خروجی Excel',
    totalSavings: 'مجموع پس‌انداز',
    totalPayouts: 'مجموع پرداخت‌ها',
    averageContribution: 'میانگین پرداخت',
    onTimeRate: 'نرخ پرداخت به موقع',
  },
  
  // خطاها
  error: {
    generic: 'خطایی رخ داد',
    notFound: 'یافت نشد',
    unauthorized: 'دسترسی غیرمجاز',
    forbidden: 'اجازه دسترسی ندارید',
    validation: 'اطلاعات نامعتبر',
    server: 'خطای سرور',
    network: 'خطای شبکه',
    sessionExpired: 'نشست منقضی شده',
  },
  
  // موفقیت‌ها
  success: {
    saved: 'ذخیره شد',
    updated: 'به‌روزرسانی شد',
    deleted: 'حذف شد',
    created: 'ایجاد شد',
    sent: 'ارسال شد',
  },
  
  // زمان
  time: {
    now: 'همین الان',
    today: 'امروز',
    yesterday: 'دیروز',
    tomorrow: 'فردا',
    thisWeek: 'این هفته',
    thisMonth: 'این ماه',
    ago: 'پیش',
    remaining: 'باقی‌مانده',
    days: 'روز',
    hours: 'ساعت',
    minutes: 'دقیقه',
    seconds: 'ثانیه',
  },
  
  // پول
  currency: {
    toman: 'تومان',
    rial: 'ریال',
    million: 'میلیون',
    billion: 'میلیارد',
  },
  
  // راهنما
  help: {
    nonCustodial: 'این سیستم غیرامانی است و پول نگه نمی‌دارد',
    trustPrinciple: 'سیستم اعتماد را مستند می‌کند، جایگزین آن نمی‌شود',
    oneWinRule: 'هر عضو فقط یک بار در هر صندوق برنده می‌شود',
    allMustPay: 'همه اعضا باید پرداخت کنند تا قرعه‌کشی انجام شود',
  },
};

export type TranslationKeys = typeof fa;
export default fa;
