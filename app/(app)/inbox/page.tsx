'use client';

import { useState } from 'react';
import { InboxInput } from '@/components/inbox-input';
import { PreviewDrawer } from '@/components/preview-drawer';
import { apiClient } from '@/lib/apiClient';
import { type PreviewTask, type ParseResponse } from '@/lib/ai/schema';
import { toast } from 'sonner';

export default function InboxPage() {
  const [isParsing, setIsParsing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    input: string;
    previewTasks: PreviewTask[];
    suggestions?: ParseResponse['suggestions'];
  } | null>(null);
  const [recentInputs, setRecentInputs] = useState<string[]>([]);

  const handleParse = async (text: string) => {
    try {
      setIsParsing(true);
      const result = await apiClient<ParseResponse>('/api/ai/parse', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });

      setPreviewData({
        input: text,
        previewTasks: result.previewTasks,
        suggestions: result.suggestions,
      });
      setPreviewOpen(true);
      setRecentInputs((prev) => [text, ...prev.slice(0, 9)]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '파싱 실패');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApply = async () => {
    if (!previewData) return;

    try {
      await apiClient('/api/ai/apply', {
        method: 'POST',
        body: JSON.stringify({
          input: previewData.input,
          previewTasks: previewData.previewTasks,
        }),
      });

      toast.success('할일이 생성되었습니다.');
      setPreviewOpen(false);
      setPreviewData(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '적용 실패');
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Inbox</h1>
        <p className="text-muted-foreground mt-2">
          자연어로 할일을 입력하면 AI가 구조화해드립니다.
        </p>
      </div>

      <div className="max-w-2xl">
        <InboxInput onParse={handleParse} isLoading={isParsing} />
      </div>

      {recentInputs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">최근 입력</h2>
          <div className="space-y-2">
            {recentInputs.map((input, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 text-sm text-muted-foreground"
              >
                {input}
              </div>
            ))}
          </div>
        </div>
      )}

      {previewData && (
        <PreviewDrawer
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          previewTasks={previewData.previewTasks}
          suggestions={previewData.suggestions}
          onApply={handleApply}
        />
      )}
    </div>
  );
}
