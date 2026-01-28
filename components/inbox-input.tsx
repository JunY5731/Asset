'use client';

import { useState, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface InboxInputProps {
  onParse: (text: string) => Promise<void>;
  isLoading?: boolean;
}

export function InboxInput({ onParse, isLoading = false }: InboxInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (!text.trim() || isLoading) return;
    await onParse(text.trim());
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="할일을 자연어로 입력하세요... (Enter: 제출, Shift+Enter: 줄바꿈)"
        className="min-h-[120px] resize-none"
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!text.trim() || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              처리 중...
            </>
          ) : (
            'AI로 정리'
          )}
        </Button>
      </div>
    </div>
  );
}
