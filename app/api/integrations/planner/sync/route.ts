import { NextRequest, NextResponse } from 'next/server';
import { fetchPlannerTasks } from '@/lib/msgraph/client';
import { upsertExternalItem } from '@/lib/db/externalItems';
import { updateSettings } from '@/lib/db/settings';

export async function POST(request: NextRequest) {
  try {
    const tasks = await fetchPlannerTasks();

    // Upsert external items
    await Promise.all(
      tasks.map((task) =>
        upsertExternalItem({
          provider: 'planner',
          external_id: task.id,
          title: task.title || null,
          raw_snapshot: task,
        })
      )
    );

    // Update last sync time
    await updateSettings({
      planner_last_sync: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      synced: tasks.length,
    });
  } catch (error) {
    // Store error in settings or log
    console.error('Planner sync error:', error);

    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
