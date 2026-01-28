import { NextRequest, NextResponse } from 'next/server';
import { createTask } from '@/lib/db/tasks';
import { createAiRun, markAiRunAsApplied } from '@/lib/db/aiRuns';
import { ParseResponseSchema, type PreviewTask } from '@/lib/ai/schema';
import { z } from 'zod';

const RequestSchema = z.object({
  input: z.string(),
  aiRunId: z.string().uuid().optional(),
  previewTasks: z.array(
    z.object({
      title: z.string(),
      dueDate: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
      description: z.string().optional(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, aiRunId, previewTasks } = RequestSchema.parse(body);

    // Create tasks
    const tasks = await Promise.all(
      previewTasks.map(async (preview) => {
        return createTask({
          title: preview.title,
          description: preview.description,
          priority: preview.priority,
          due_date: preview.dueDate
            ? new Date(preview.dueDate).toISOString()
            : undefined,
        });
      })
    );

    // Mark AI run as applied if provided
    if (aiRunId) {
      await markAiRunAsApplied(aiRunId);
    } else {
      // Create new AI run record
      await createAiRun({
        input,
        output: { previewTasks },
        applied: true,
      });
    }

    return NextResponse.json({ tasks, count: tasks.length });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: error.message } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    );
  }
}
