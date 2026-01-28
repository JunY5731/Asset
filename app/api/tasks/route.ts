import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask } from '@/lib/db/tasks';
import { CreateTaskSchema } from '@/lib/db/tasks';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const source = searchParams.get('source');

    const tasks = await getTasks({
      status: status as 'TODO' | 'DOING' | 'DONE' | undefined,
      priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | undefined,
      source: source as 'internal' | 'planner' | undefined,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateTaskSchema.parse(body);
    const task = await createTask(validated);

    return NextResponse.json({ task }, { status: 201 });
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
