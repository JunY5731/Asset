'use client';

import { useState } from 'react';
import { LoanModal } from '@/components/loan-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface LoanLog {
  id: string;
  borrowerName: string;
  borrowerTeam: string;
  itemsTaken: string[];
  timestamp: string;
}

export default function LoanPage() {
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [loanLogs, setLoanLogs] = useState<LoanLog[]>([]);

  const handleLoanConfirm = async (data: {
    borrowerName: string;
    borrowerTeam: string;
    itemsTaken: string[];
  }) => {
    // TODO: 실제 API 호출하여 DB에 저장
    const newLog: LoanLog = {
      id: Date.now().toString(),
      ...data,
      timestamp: new Date().toISOString(),
    };

    setLoanLogs((prev) => [newLog, ...prev]);
    
    // 실제로는 API 호출
    // await fetch('/api/loan/save', { method: 'POST', body: JSON.stringify(newLog) });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">자산 대여/반납</h1>
          <p className="text-muted-foreground mt-2">
            카메라를 이용한 자동 품목 인식 대여 시스템
          </p>
        </div>
        <Button onClick={() => setLoanModalOpen(true)}>대여하기</Button>
      </div>

      <div className="grid gap-6">
        {/* 대여 로그 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>대여 내역</CardTitle>
            <CardDescription>최근 대여 기록을 확인할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {loanLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                대여 내역이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {loanLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {log.borrowerName} ({log.borrowerTeam})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {log.itemsTaken.map((item) => (
                        <span
                          key={item}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LoanModal
        open={loanModalOpen}
        onOpenChange={setLoanModalOpen}
        onConfirm={handleLoanConfirm}
      />
    </div>
  );
}
