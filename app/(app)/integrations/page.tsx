'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Settings {
  planner_connected: boolean;
  planner_last_sync: string | null;
}

export default function IntegrationsPage() {
  const [plannerConnected, setPlannerConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Note: In a real app, you'd have a /api/settings endpoint
      // For now, we'll check connection status via sync endpoint
      const response = await fetch('/api/integrations/planner/connect');
      if (response.ok) {
        // If connect endpoint works, we can assume settings exist
        // In production, create a proper settings endpoint
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleConnect = async () => {
    try {
      const result = await apiClient<{ authUrl: string }>('/api/integrations/planner/connect');
      window.location.href = result.authUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '연결 실패');
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await apiClient('/api/integrations/planner/sync', {
        method: 'POST',
      });
      toast.success('동기화가 완료되었습니다.');
      setLastSync(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '동기화 실패');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">외부 서비스와 연동하세요.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Microsoft Planner</CardTitle>
              <CardDescription>
                Planner의 할일을 읽기 전용으로 미러링합니다.
              </CardDescription>
            </div>
            <Badge variant={plannerConnected ? 'default' : 'secondary'}>
              {plannerConnected ? '연결됨' : '연결 안됨'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!plannerConnected ? (
            <Button onClick={handleConnect}>연결하기</Button>
          ) : (
            <div className="space-y-4">
              {lastSync && (
                <p className="text-sm text-muted-foreground">
                  마지막 동기화:{' '}
                  {format(new Date(lastSync), 'yyyy-MM-dd HH:mm', { locale: ko })}
                </p>
              )}
              <Button onClick={handleSync} disabled={syncing}>
                {syncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    동기화 중...
                  </>
                ) : (
                  '동기화'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
