'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  ArrowRight,
  Users,
  DollarSign,
  Calendar,
  Trophy,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  UserPlus,
  Settings,
  Share2,
  Crown,
  TrendingUp,
} from 'lucide-react';
import {
  toPersianNumber,
  formatToman,
  formatJalaliFull,
  formatJalaliShort,
  timeRemaining,
} from '@/lib/persian';
import fa from '@/lib/translations';

interface GroupDetail {
  id: string;
  name: string;
  description?: string;
  amountPerCycle: string;
  totalMembers: number;
  status: string;
  groupType: string;
  owner: { id: string; fullName: string };
  members: Array<{
    id: string;
    role: string;
    user: { id: string; fullName: string; phone: string };
  }>;
  cycles: Array<{
    id: string;
    cycleNumber: number;
    status: string;
    dueDate: string;
    contributions: Array<{
      id: string;
      userId: string;
      amount: string;
      status: string;
    }>;
    draw?: {
      winner: { id: string; fullName: string };
    };
  }>;
  statistics: {
    totalCollected: string;
    currentCycle: number | null;
    completedCycles: number;
    totalMembers: number;
    expectedMembers: number;
    isFull: boolean;
  };
}

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const { toast } = useToast();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContributing, setIsContributing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [phoneToJoin, setPhoneToJoin] = useState('');

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();

      if (data.success) {
        setGroup(data.data.group);
      } else {
        toast({
          title: 'خطا',
          description: data.error?.message || 'بارگذاری صندوق ناموفق بود',
          variant: 'destructive',
        });
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, router, toast]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const getCurrentCycle = () => {
    return group?.cycles.find((c) => c.status === 'OPEN');
  };

  const hasUserContributed = (userId: string) => {
    const cycle = getCurrentCycle();
    if (!cycle) return false;
    return cycle.contributions.some((c) => c.userId === userId && c.status === 'CONFIRMED');
  };

  const contribute = async () => {
    const cycle = getCurrentCycle();
    if (!cycle || !group) return;

    setIsContributing(true);
    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: cycle.id,
          amount: group.amountPerCycle,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: 'پرداخت ثبت شد ✅',
          description: 'پرداخت شما با موفقیت ثبت شد',
        });
        fetchGroup();
      } else {
        toast({
          title: 'خطا',
          description: data.error?.message || 'ثبت پرداخت ناموفق بود',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'خطا',
        description: 'ثبت پرداخت ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setIsContributing(false);
    }
  };

  const performDraw = async () => {
    setIsDrawing(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/draw`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: '🎉 قرعه‌کشی انجام شد!',
          description: data.data.message,
        });
        fetchGroup();
      } else {
        toast({
          title: 'خطا',
          description: data.error?.message || 'قرعه‌کشی ناموفق بود',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'خطا',
        description: 'قرعه‌کشی ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setIsDrawing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      OPEN: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      CLOSED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      UPCOMING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
    const labels: Record<string, string> = {
      ACTIVE: 'فعال',
      OPEN: 'جاری',
      DRAFT: 'پیش‌نویس',
      COMPLETED: 'تکمیل شده',
      CLOSED: 'بسته شده',
      PAUSED: 'متوقف',
      CANCELLED: 'لغو شده',
      UPCOMING: 'در انتظار',
    };
    return (
      <Badge className={styles[status] || styles.DRAFT}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 'ADMIN':
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  const currentCycle = getCurrentCycle();
  const confirmedCount = currentCycle?.contributions.filter((c) => c.status === 'CONFIRMED').length || 0;
  const contributionProgress = group.members.length > 0 
    ? (confirmedCount / group.members.length) * 100 
    : 0;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* هدر */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowRight className="h-4 w-4 ml-2" />
            بازگشت
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{group.name}</h1>
            <p className="text-sm text-gray-500">
              مدیریت: {group.owner.fullName}
            </p>
          </div>
          {getStatusBadge(group.status)}
          <Button variant="ghost" size="icon">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* محتوا */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* آمار */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">مبلغ هر دوره</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {formatToman(group.amountPerCycle)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">اعضا</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {toPersianNumber(group.members.length)} از {toPersianNumber(group.totalMembers)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">دوره جاری</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {group.statistics.currentCycle ? toPersianNumber(group.statistics.currentCycle) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">مجموع جمع‌آوری</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {toPersianNumber(parseInt(group.statistics.totalCollected) / 1000000)} م
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* دوره جاری */}
          <div className="lg:col-span-2 space-y-6">
            {/* کارت دوره جاری */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  دوره جاری
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentCycle ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">دوره شماره</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                          {toPersianNumber(currentCycle.cycleNumber)}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-gray-500">سررسید</p>
                        <p className="font-medium">{formatJalaliShort(currentCycle.dueDate)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {timeRemaining(currentCycle.dueDate)} باقی‌مانده
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">پیشرفت پرداخت‌ها</span>
                        <span className="font-medium">
                          {toPersianNumber(confirmedCount)} از {toPersianNumber(group.members.length)}
                        </span>
                      </div>
                      <Progress value={contributionProgress} className="h-3" />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={contribute}
                        disabled={isContributing}
                      >
                        {isContributing ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <DollarSign className="h-4 w-4 ml-2" />
                        )}
                        ثبت پرداخت
                      </Button>
                      <Button
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={performDraw}
                        disabled={isDrawing || contributionProgress < 100}
                      >
                        {isDrawing ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <Play className="h-4 w-4 ml-2" />
                        )}
                        قرعه‌کشی
                      </Button>
                    </div>
                    
                    {contributionProgress < 100 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                        <AlertCircle className="h-3 w-3" />
                        همه اعضا باید پرداخت کنند تا قرعه‌کشی انجام شود
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>دوره فعالی وجود ندارد</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* تاریخچه دوره‌ها */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>تاریخچه دوره‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.cycles.map((cycle) => (
                    <div
                      key={cycle.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            cycle.status === 'CLOSED'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                          }`}
                        >
                          {cycle.status === 'CLOSED' ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Clock className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">دوره {toPersianNumber(cycle.cycleNumber)}</p>
                          <p className="text-sm text-gray-500">
                            {toPersianNumber(cycle.contributions.filter(c => c.status === 'CONFIRMED').length)} پرداخت
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {cycle.draw && (
                          <div className="text-left">
                            <p className="text-xs text-gray-500">برنده</p>
                            <p className="font-medium text-emerald-600">{cycle.draw.winner.fullName}</p>
                          </div>
                        )}
                        {getStatusBadge(cycle.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ستون کناری */}
          <div className="space-y-6">
            {/* اعضا */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">اعضا</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <UserPlus className="h-4 w-4 ml-1" />
                        دعوت
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>دعوت به صندوق</DialogTitle>
                        <DialogDescription>
                          شماره موبایل فرد مورد نظر را وارد کنید
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>شماره موبایل</Label>
                          <Input
                            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                            value={phoneToJoin}
                            onChange={(e) => setPhoneToJoin(e.target.value)}
                          />
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                          ارسال دعوت‌نامه
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-600 font-medium">
                          {member.user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.user.fullName}</p>
                          <p className="text-xs text-gray-500">{member.user.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentCycle && hasUserContributed(member.user.id) && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {getRoleIcon(member.role)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* برندگان */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  برندگان
                </CardTitle>
              </CardHeader>
              <CardContent>
                {group.cycles.filter((c) => c.draw).length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">هنوز قرعه‌کشی نشده</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {group.cycles
                      .filter((c) => c.draw)
                      .map((cycle) => (
                        <div
                          key={cycle.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20"
                        >
                          <div className="flex items-center gap-3">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            <div>
                              <p className="font-medium text-sm">{cycle.draw?.winner.fullName}</p>
                              <p className="text-xs text-gray-500">دوره {toPersianNumber(cycle.cycleNumber)}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                            برنده
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
