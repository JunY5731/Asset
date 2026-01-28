 'use client';
 
 import { useState } from 'react';
 import { supabase } from '@/lib/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { toast } from 'sonner';
 
 export function EmployeeRegisterPanel({ onCreated }: { onCreated: () => void }) {
   const [name, setName] = useState('');
   const [team, setTeam] = useState('총무팀');
   const [title, setTitle] = useState('사원');
   const [loading, setLoading] = useState(false);
 
   const handleCreate = async () => {
     const n = name.trim();
     const t = team.trim();
     const ti = title.trim();
     if (!n || !t || !ti) {
       toast.error('이름/팀/직급을 입력하세요.');
       return;
     }
 
     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
     const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
     if (!supabaseUrl || !supabaseAnonKey) {
       toast.error('Supabase 환경 변수가 설정되지 않았습니다(.env.local).');
       return;
     }
 
     setLoading(true);
     try {
       const { error } = await supabase.from('employees').insert({
         name: n,
         team: t,
         title: ti,
         is_active: true,
       });
       if (error) throw error;
       toast.success('직원이 등록되었습니다.');
       setName('');
       onCreated();
     } catch (e) {
       console.error(e);
       toast.error('직원 등록 실패');
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <Card>
       <CardHeader>
         <CardTitle>직원 등록</CardTitle>
         <CardDescription>대여자 후보(직원) 목록을 추가합니다.</CardDescription>
       </CardHeader>
       <CardContent className="space-y-3">
         <div className="grid grid-cols-3 gap-3">
           <div className="space-y-1">
             <Label htmlFor="emp-name">이름</Label>
             <Input id="emp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
           </div>
           <div className="space-y-1">
             <Label htmlFor="emp-team">팀</Label>
             <Input id="emp-team" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="총무팀" />
           </div>
           <div className="space-y-1">
             <Label htmlFor="emp-title">직급</Label>
             <Input id="emp-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="사원" />
           </div>
         </div>
         <Button onClick={handleCreate} disabled={loading}>
           {loading ? '등록 중...' : '직원 추가'}
         </Button>
       </CardContent>
     </Card>
   );
 }

