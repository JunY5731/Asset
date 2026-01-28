import { NextResponse } from 'next/server';
import {
  getTasksByDueDate,
  getOverdueTasks,
  getHighPriorityTasks,
  getCompletionRate7d,
} from '@/lib/db/tasks';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export async function GET() {
  try {
    // Get today's date in Asia/Seoul timezone
    // Display in Asia/Seoul, but compare with UTC dates in DB
    const seoulTz = 'Asia/Seoul';
    const now = new Date();
    const seoulNow = toZonedTime(now, seoulTz);
    const today = new Date(seoulNow);
    today.setHours(0, 0, 0, 0);
    // Convert back to UTC for DB comparison
    const todayUTC = fromZonedTime(today, seoulTz);

    const [todayTasks, overdueTasks, highPriorityTasks, completionRate] =
      await Promise.all([
        getTasksByDueDate(todayUTC),
        getOverdueTasks(),
        getHighPriorityTasks(),
        getCompletionRate7d(),
      ]);

    return NextResponse.json({
      metrics: {
        todayCount: todayTasks.length,
        overdueCount: overdueTasks.length,
        highPriorityCount: highPriorityTasks.length,
        completionRate7d: completionRate,
      },
      todayTasks: todayTasks.slice(0, 5),
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    );
  }
}
