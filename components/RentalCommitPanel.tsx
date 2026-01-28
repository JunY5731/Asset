'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase/client';
import { ITEM_MAP } from '@/lib/constants';
import { toast } from 'sonner';

interface RentalCommitPanelProps {
  employeeId: string | null;
  employeeName: string;
  employeeTeam: string;
  itemsTaken: string[]; // 품목명 배열 (예: ["각티슈", "볼펜"])
  onSuccess: () => void;
}

export function RentalCommitPanel({
  employeeId,
  employeeName,
  employeeTeam,
  itemsTaken,
  onSuccess,
}: RentalCommitPanelProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 품목명을 ID로 변환
  const itemsTakenIds = itemsTaken
    .map(name => {
      const entry = Object.entries(ITEM_MAP).find(([_, n]) => n === name);
      return entry ? entry[0] : null;
    })
    .filter((id): id is string => id !== null);

  const handleSubmit = async () => {
    if (!employeeId) {
      toast.error('직원을 선택해주세요.');
      return;
    }

    if (itemsTakenIds.length === 0) {
      toast.error('반출 품목을 선택해주세요.');
      return;
    }

    // Supabase 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      toast.error('Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('rentals').insert({
        employee_id: employeeId,
        items_taken: itemsTakenIds,
        note: note || null,
      });

      if (error) {
        throw error;
      }

      toast.success('대여가 완료되었습니다.');
      setNote('');
      onSuccess();
    } catch (error) {
      console.error('Rental commit error:', error);
      toast.error('대여 저장 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div>
        <Label className="text-sm font-medium">대여 정보</Label>
        <div className="mt-2 space-y-2">
          <div className="text-sm">
            <span className="font-medium">대여자:</span> {employeeTeam} {employeeName}
          </div>
          <div className="text-sm">
            <span className="font-medium">반출 품목:</span>{' '}
            {itemsTaken.length > 0 ? itemsTaken.join(', ') : '없음'}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="note">메모 (선택)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="추가 메모를 입력하세요"
          className="mt-1"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !employeeId || itemsTakenIds.length === 0}
        className="w-full"
      >
        {isSubmitting ? '저장 중...' : '대여 확정'}
      </Button>
    </div>
  );
}
