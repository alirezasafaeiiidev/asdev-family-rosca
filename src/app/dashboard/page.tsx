'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Plus,
  Users,
  DollarSign,
  Calendar,
  LogOut,
  User,
  ChevronLeft,
  Settings,
  Bell,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toPersianNumber, formatToman, formatJalaliShort, timeAgo } from '@/lib/persian';
import fa from '@/lib/translations';

interface User {
  id: string;
  phone: string;
  fullName: string;
}

interface Group {
  id: string;
  name: string;
  amountPerCycle: string;
  totalMembers: number;
  status: string;
  groupType: string;
  owner: { id: string; fullName: string };
  _count: { members: number; cycles: number };
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [amountPerCycle, setAmountPerCycle] = useState('');
  const [totalMembers, setTotalMembers] = useState('');
  const [groupType, setGroupType] = useState('FAMILY');

  const fetchData = useCallback(async () => {
    try {
      const [userRes, groupsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/groups'),
      ]);

      const userData = await userRes.json();
      const groupsData = await groupsRes.json();

      if (!userData.success) {
        router.push('/');
        return;
      }

      setUser(userData.data.user);
      if (groupsData.success) {
        setGroups(groupsData.data.groups);
      }
    } catch {
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const createGroup = async () => {
    if (!groupName || !amountPerCycle || !totalMembers) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدها را پر کنید',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          amountPerCycle,
          totalMembers: parseInt(totalMembers),
          groupType,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: 'صندوق ایجاد شد! ✅',
          description: 'صندوق جدید با موفقیت ایجاد شد',
        });
        setIsDialogOpen(false);
        setGroupName('');
        setGroupDescription('');
        setAmountPerCycle('');
        setTotalMembers('');
        fetchData();
      } else {
        toast({
          title: 'خطا',
          description: data.error?.message || 'ایجاد صندوق ناموفق بود',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'خطا',
        description: 'ایجاد صندوق ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };
    const labels: Record<string, string> = {
      ACTIVE: 'فعال',
      DRAFT: 'پیش‌نویس',
      COMPLETED: 'تکمیل شده',
      PAUSED: 'متوقف',
      CANCELLED: 'لغو شده',
    };
    return (
      <Badge className={styles[status] || styles.DRAFT}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getGroupTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FAMILY: '👨‍👩‍👧‍👦 خانوادگی',
      FRIENDS: '👥 دوستانه',
      NEIGHBORHOOD: '🏠 همسایگی',
      WORKPLACE: '🏢 محیط کار',
      CUSTOM: '⚙️ سفارشی',
    };
    return labels[type] || labels.CUSTOM;
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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* هدر */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">💰</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {fa.appName}
              </h1>
              <p className="text-xs text-gray-500">نسخه سازمانی</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full py-1 px-3">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{user?.fullName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      {/* محتوا */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* خوش‌آمدگویی */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            سلام، {user?.fullName} 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            به داشبورد مدیریت صندوق خوش آمدید
          </p>
        </div>

        {/* آمار */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">صندوق‌های من</p>
                  <p className="text-3xl font-bold mt-1">{toPersianNumber(groups.length)}</p>
                </div>
                <Users className="h-10 w-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">صندوق‌های فعال</p>
                  <p className="text-3xl font-bold mt-1">
                    {toPersianNumber(groups.filter(g => g.status === 'ACTIVE').length)}
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">مجموع پس‌انداز</p>
                  <p className="text-2xl font-bold mt-1">
                    {toPersianNumber(groups.reduce((sum, g) => sum + parseInt(g.amountPerCycle || '0') * g._count.members, 0) / 1000000)}
                  </p>
                  <p className="text-xs text-amber-100">میلیون تومان</p>
                </div>
                <TrendingUp className="h-10 w-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">اعضا در صندوق‌ها</p>
                  <p className="text-3xl font-bold mt-1">
                    {toPersianNumber(groups.reduce((sum, g) => sum + g._count.members, 0))}
                  </p>
                </div>
                <Users className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* لیست صندوق‌ها */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">صندوق‌های من</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 ml-2" />
                ایجاد صندوق جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>ایجاد صندوق جدید</DialogTitle>
                <DialogDescription>
                  یک صندوق قرض‌الحسنه جدید برای خانواده یا دوستان ایجاد کنید
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>نام صندوق</Label>
                  <Input
                    placeholder="صندوق خانوادگی"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع صندوق</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['FAMILY', 'FRIENDS', 'NEIGHBORHOOD'].map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={groupType === type ? 'default' : 'outline'}
                        className={groupType === type ? 'bg-emerald-600' : ''}
                        onClick={() => setGroupType(type)}
                      >
                        {getGroupTypeLabel(type)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>مبلغ هر دوره (تومان)</Label>
                  <Input
                    type="text"
                    placeholder="۱,۰۰۰,۰۰۰"
                    value={amountPerCycle}
                    onChange={(e) => setAmountPerCycle(e.target.value.replace(/[^0-9]/g, ''))}
                    className="font-mono"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تعداد اعضا</Label>
                  <Input
                    type="number"
                    min={2}
                    max={50}
                    placeholder="۵"
                    value={totalMembers}
                    onChange={(e) => setTotalMembers(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
                  onClick={createGroup}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال ایجاد...
                    </>
                  ) : (
                    'ایجاد صندوق'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {groups.length === 0 ? (
          <Card className="text-center py-16 bg-white dark:bg-gray-800">
            <CardContent>
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                هنوز صندوقی ندارید
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                اولین صندوق خانوادگی یا دوستانه خود را ایجاد کنید
              </p>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 ml-2" />
                ایجاد اولین صندوق
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800"
                onClick={() => router.push(`/groups/${group.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {getGroupTypeLabel(group.groupType)}
                      </CardDescription>
                    </div>
                    {getStatusBadge(group.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">مبلغ هر دوره</span>
                      <span className="font-bold text-emerald-600">
                        {formatToman(group.amountPerCycle)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">اعضا</span>
                      <span className="font-medium">
                        {toPersianNumber(group._count.members)} از {toPersianNumber(group.totalMembers)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">مدیر</span>
                      <span className="font-medium">{group.owner.fullName}</span>
                    </div>
                    <div className="pt-2 border-t dark:border-gray-700 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {formatJalaliShort(group.createdAt)}
                      </span>
                      <ChevronLeft className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
