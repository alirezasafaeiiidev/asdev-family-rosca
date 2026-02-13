'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Phone, 
  KeyRound, 
  ShieldCheck,
  Users,
  Trophy,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { toPersianNumber, formatToman } from '@/lib/persian';
import fa from '@/lib/translations';

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          router.push('/dashboard');
        }
      })
      .catch(() => {});
  }, [router]);

  const requestOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: 'خطا',
        description: 'لطفاً شماره موبایل معتبر وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('otp');
        toast({
          title: 'کد تأیید ارسال شد',
          description: 'لطفاً کد ارسال شده را وارد کنید',
        });
      } else {
        toast({
          title: 'خطا',
          description: data.error?.message || 'ارسال کد ناموفق بود',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'خطا',
        description: 'ارسال کد ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: 'خطا',
        description: 'لطفاً کد ۶ رقمی را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: 'خوش آمدید! 👋',
          description: data.data?.user?.isNewUser
            ? 'حساب کاربری شما ایجاد شد'
            : 'ورود موفق',
        });
        router.push('/dashboard');
      } else {
        toast({
          title: 'خطا',
          description: data.error?.message || 'کد نامعتبر',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'خطا',
        description: 'تأیید کد ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-bl from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* هدر */}
      <header className="w-full py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">💰</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {fa.appName}
              </h1>
              <p className="text-xs text-gray-500">نسخه سازمانی</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            غیرامانی
          </div>
        </div>
      </header>

      {/* محتوای اصلی */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* بخش معرفی */}
          <div className="space-y-6 text-center lg:text-right">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white leading-tight">
              مدیریت هوشمند
              <br />
              <span className="text-emerald-600">صندوق‌های خانوادگی</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              سیستم مستندسازی اعتماد برای صندوق‌های قرض‌الحسنه خانوادگی، دوستانه و همسایگی
            </p>
            
            {/* ویژگی‌ها */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <Users className="w-8 h-8 text-emerald-500 mx-auto lg:mx-0 mb-2" />
                <h3 className="font-bold text-gray-800 dark:text-white">مدیریت اعضا</h3>
                <p className="text-sm text-gray-500 mt-1">مدیریت کامل اعضا و نقش‌ها</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <Trophy className="w-8 h-8 text-amber-500 mx-auto lg:mx-0 mb-2" />
                <h3 className="font-bold text-gray-800 dark:text-white">قرعه‌کشی عادلانه</h3>
                <p className="text-sm text-gray-500 mt-1">هر نفر یک بار برنده</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <TrendingUp className="w-8 h-8 text-blue-500 mx-auto lg:mx-0 mb-2" />
                <h3 className="font-bold text-gray-800 dark:text-white">گزارش‌گیری</h3>
                <p className="text-sm text-gray-500 mt-1">گزارش‌های کامل مالی</p>
              </div>
            </div>
          </div>

          {/* فرم ورود */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {step === 'phone' ? 'ورود به حساب' : 'تأیید شماره موبایل'}
                </CardTitle>
                <CardDescription>
                  {step === 'phone' 
                    ? 'شماره موبایل خود را وارد کنید'
                    : 'کد ۶ رقمی ارسال شده را وارد کنید'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step === 'phone' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{fa.auth.phone}</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pr-11 h-12 text-lg"
                          dir="rtl"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg"
                      onClick={requestOtp}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          در حال ارسال...
                        </>
                      ) : (
                        <>
                          {fa.auth.sendOtp}
                          <ArrowLeft className="mr-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">{fa.auth.otp}</Label>
                      <div className="relative">
                        <KeyRound className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="otp"
                          type="text"
                          maxLength={6}
                          placeholder="------"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="pr-11 h-14 text-center text-2xl tracking-[0.5em] font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg"
                      onClick={verifyOtp}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          در حال تأیید...
                        </>
                      ) : (
                        <>
                          {fa.auth.verifyOtp}
                          <ArrowLeft className="mr-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setStep('phone')}
                    >
                      تغییر شماره موبایل
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-center text-sm text-gray-500">
                با ورود، شرایط استفاده را می‌پذیرید
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* فوتر */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur py-4 text-center text-sm text-gray-500 border-t dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-6">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            {fa.help.nonCustodial}
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:flex items-center gap-2">
            📅 تقویم شمسی
          </span>
        </div>
      </footer>
    </main>
  );
}
