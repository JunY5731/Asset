 'use client';
 
 import { useMemo, useState } from 'react';
 import { supabase } from '@/lib/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { toast } from 'sonner';
 import { ITEM_MAP } from '@/lib/constants';
 
 export type ItemRow = {
   id: string;
   name: string;
   is_active: boolean;
 };
 
 export function ItemConfigPanel({
   items,
   onSaved,
 }: {
   items: ItemRow[];
   onSaved: () => void;
 }) {
   const [draft, setDraft] = useState<Record<string, { name: string; is_active: boolean }>>({});
   const [saving, setSaving] = useState(false);
 
   const merged = useMemo(() => {
     const base: ItemRow[] = items.length
       ? items
       : Object.keys(ITEM_MAP).map((id) => ({ id, name: ITEM_MAP[id] ?? id, is_active: true }));
 
     return base.map((it) => {
       const d = draft[it.id];
       return {
         ...it,
         name: d?.name ?? it.name,
         is_active: d?.is_active ?? it.is_active,
       };
     });
   }, [items, draft]);
 
   const setItemDraft = (id: string, next: { name?: string; is_active?: boolean }) => {
     setDraft((prev) => {
       const cur = prev[id] ?? { name: merged.find((m) => m.id === id)?.name ?? id, is_active: true };
       return {
         ...prev,
         [id]: {
           name: next.name ?? cur.name,
           is_active: typeof next.is_active === 'boolean' ? next.is_active : cur.is_active,
         },
       };
     });
   };
 
   const handleSave = async () => {
     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
     const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
     if (!supabaseUrl || !supabaseAnonKey) {
       toast.error('Supabase 환경 변수가 설정되지 않았습니다(.env.local).');
       return;
     }
 
     setSaving(true);
     try {
       const payload = merged.map((it) => ({
         id: it.id,
         name: it.name.trim() || it.id,
         is_active: it.is_active,
       }));
 
       const { error } = await supabase.from('items').upsert(payload, { onConflict: 'id' });
       if (error) throw error;
 
       toast.success('품목 설정이 저장되었습니다.');
       setDraft({});
       onSaved();
     } catch (e) {
       console.error(e);
       toast.error('품목 저장 실패');
     } finally {
       setSaving(false);
     }
   };
 
   return (
     <Card>
       <CardHeader>
         <CardTitle>품목(자산/소모품) 설정</CardTitle>
         <CardDescription>
           품목명 변경 및 활성/비활성 설정. (QR 인식은 ITEM_01~05만 지원)
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
         <div className="space-y-3">
           {merged.map((it) => (
             <div key={it.id} className="grid grid-cols-12 gap-3 items-center">
               <div className="col-span-3 text-sm font-medium">{it.id}</div>
               <div className="col-span-7">
                 <Label className="sr-only" htmlFor={`item-${it.id}`}>품목명</Label>
                 <Input
                   id={`item-${it.id}`}
                   value={it.name}
                   onChange={(e) => setItemDraft(it.id, { name: e.target.value })}
                   placeholder="품목명"
                 />
               </div>
               <div className="col-span-2 flex items-center justify-end gap-2">
                 <span className="text-xs text-muted-foreground">활성</span>
                 <Switch
                   checked={it.is_active}
                   onCheckedChange={(checked) => setItemDraft(it.id, { is_active: checked })}
                 />
               </div>
             </div>
           ))}
         </div>
         <Button onClick={handleSave} disabled={saving}>
           {saving ? '저장 중...' : '저장'}
         </Button>
       </CardContent>
     </Card>
   );
 }

