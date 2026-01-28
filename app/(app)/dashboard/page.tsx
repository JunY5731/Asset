'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/metric-card';
import { TaskList } from '@/components/task-list';
import { AiSuggestionPanel } from '@/components/ai-suggestion-panel';
import { Calendar, AlertTriangle, Star, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { type Task } from '@/lib/db/tasks';
import { type AiSuggestion } from '@/lib/ai/schema';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardData {
  metrics: {
    todayCount: number;
    overdueCount: number;
    highPriorityCount: number;
    completionRate7d: number;
  };
  todayTasks: Task[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboardData = await apiClient<DashboardData>('/api/dashboard');
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: Task['status']) => {
    try {
      await apiClient(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadDashboard();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-8">데이터를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">오늘의 할일과 통계를 확인하세요.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="오늘 할일"
          value={data.metrics.todayCount}
          icon={Calendar}
          description="오늘 마감 예정"
        />
        <MetricCard
          title="지연된 할일"
          value={data.metrics.overdueCount}
          icon={AlertTriangle}
          description="마감일 지남"
        />
        <MetricCard
          title="중요한 할일"
          value={data.metrics.highPriorityCount}
          icon={Star}
          description="높은 우선순위"
        />
        <MetricCard
          title="완료율 (7일)"
          value={`${data.metrics.completionRate7d}%`}
          icon={TrendingUp}
          description="최근 7일간"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">오늘의 할일 (Top 5)</h2>
          <TaskList
            tasks={data.todayTasks}
            onStatusChange={handleStatusChange}
            showActions={true}
          />
        </div>
        <div>
          <AiSuggestionPanel suggestions={suggestions} />
        </div>
      </div>
    </div>
  );
}
