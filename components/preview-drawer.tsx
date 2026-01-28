'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type PreviewTask, type AiSuggestion } from '@/lib/ai/schema';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewTasks: PreviewTask[];
  suggestions?: AiSuggestion[];
  onApply: () => Promise<void>;
  isLoading?: boolean;
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
};

export function PreviewDrawer({
  open,
  onOpenChange,
  previewTasks,
  suggestions,
  onApply,
  isLoading = false,
}: PreviewDrawerProps) {
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApply();
      onOpenChange(false);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>AI 미리보기</SheetTitle>
          <SheetDescription>
            생성된 할일을 확인하고 적용하세요.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {previewTasks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">할일 ({previewTasks.length}개)</h3>
              <div className="space-y-3">
                {previewTasks.map((task, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.priority && (
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.dueDate), 'yyyy-MM-dd', { locale: ko })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestions && suggestions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">추천</h3>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
                    <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>
            취소
          </Button>
          <Button onClick={handleApply} disabled={applying || isLoading}>
            {applying ? '적용 중...' : '적용'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
