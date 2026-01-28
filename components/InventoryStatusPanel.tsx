 'use client';
 
 import { useMemo } from 'react';
 import { Package, Users, ClipboardList, CalendarDays } from 'lucide-react';
 import { toZonedTime } from 'date-fns-tz';
 import { format } from 'date-fns';
 import { ko } from 'date-fns/locale';
 
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { MetricCard } from '@/components/metric-card';
 import { ITEM_MAP } from '@/lib/constants';
 
 type ItemRow = {
   id: string;
   name: string;
   is_active: boolean;
 };
 
 type RentalRow = {
   id: string;
   created_at: string;
   items_taken: string[];
 };
 
 function kstDayKey(date: Date): string {
   const d = toZonedTime(date, 'Asia/Seoul');
   const y = d.getFullYear();
   const m = String(d.getMonth() + 1).padStart(2, '0');
   const day = String(d.getDate()).padStart(2, '0');
   return `${y}-${m}-${day}`;
 }
 
 export function InventoryStatusPanel({
   items,
   rentals,
   employeesCount,
 }: {
   items: ItemRow[];
   rentals: RentalRow[];
   employeesCount: number;
 }) {
   const stats = useMemo(() => {
     const now = new Date();
     const todayKey = kstDayKey(now);
     const cutoff7dMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
 
     const takenTodayByItem: Record<string, number> = {};
     const taken7dByItem: Record<string, number> = {};
     const lastTakenAtByItem: Record<string, string> = {};
 
     let rentalsTodayCount = 0;
     let rentals7dCount = 0;
 
     for (const rental of rentals) {
       const created = new Date(rental.created_at);
       const createdKey = kstDayKey(created);
       const createdMs = created.getTime();
 
       const isToday = createdKey === todayKey;
       const isIn7d = createdMs >= cutoff7dMs;
 
       if (isToday) rentalsTodayCount += 1;
       if (isIn7d) rentals7dCount += 1;
 
       for (const itemId of rental.items_taken ?? []) {
         if (isToday) takenTodayByItem[itemId] = (takenTodayByItem[itemId] ?? 0) + 1;
         if (isIn7d) taken7dByItem[itemId] = (taken7dByItem[itemId] ?? 0) + 1;
 
         const prev = lastTakenAtByItem[itemId];
         if (!prev || new Date(prev).getTime() < createdMs) {
           lastTakenAtByItem[itemId] = rental.created_at;
         }
       }
     }
 
     return {
       todayKey,
       rentalsTodayCount,
       rentals7dCount,
       takenTodayByItem,
       taken7dByItem,
       lastTakenAtByItem,
     };
   }, [rentals]);
 
   const activeItems = items.filter((i) => i.is_active);
 
   return (
     <div className="space-y-6">
       <div>
         <h2 className="text-xl font-semibold">현황</h2>
         <p className="text-sm text-muted-foreground mt-1">
           오늘({stats.todayKey}, KST) 기준 반출/대여 기록과 품목별 통계를 보여줍니다.
         </p>
       </div>
 
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <MetricCard
           title="활성 품목"
           value={activeItems.length}
           icon={Package}
           description="items.is_active=true"
         />
         <MetricCard
           title="활성 직원"
           value={employeesCount}
           icon={Users}
           description="employees.is_active=true"
         />
         <MetricCard
           title="오늘 기록"
           value={stats.rentalsTodayCount}
           icon={CalendarDays}
           description="오늘 생성된 rentals"
         />
         <MetricCard
           title="최근 7일 기록"
           value={stats.rentals7dCount}
           icon={ClipboardList}
           description="최근 7일 생성된 rentals"
         />
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle>품목 현황</CardTitle>
           <CardDescription>
             품목별 반출 횟수(오늘/7일) 및 최근 반출 시간을 확인합니다.
           </CardDescription>
         </CardHeader>
         <CardContent>
           {activeItems.length === 0 ? (
             <div className="text-sm text-muted-foreground">등록된 활성 품목이 없습니다.</div>
           ) : (
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>품목</TableHead>
                   <TableHead>품목 ID</TableHead>
                   <TableHead>오늘</TableHead>
                   <TableHead>7일</TableHead>
                   <TableHead>최근 반출</TableHead>
                   <TableHead>상태</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {activeItems.map((item) => {
                   const itemId = item.id;
                   const displayName = item.name || ITEM_MAP[itemId] || itemId;
                   const today = stats.takenTodayByItem[itemId] ?? 0;
                   const seven = stats.taken7dByItem[itemId] ?? 0;
                   const last = stats.lastTakenAtByItem[itemId];
                   return (
                     <TableRow key={itemId}>
                       <TableCell className="font-medium">{displayName}</TableCell>
                       <TableCell className="text-muted-foreground">{itemId}</TableCell>
                       <TableCell>{today}</TableCell>
                       <TableCell>{seven}</TableCell>
                       <TableCell className="text-muted-foreground">
                         {last ? format(new Date(last), 'yyyy-MM-dd HH:mm', { locale: ko }) : '-'}
                       </TableCell>
                       <TableCell>
                         <Badge variant="secondary">ACTIVE</Badge>
                       </TableCell>
                     </TableRow>
                   );
                 })}
               </TableBody>
             </Table>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }

