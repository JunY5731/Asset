import { supabase } from '@/lib/supabase/server';
import { z } from 'zod';

export const TaskStatusSchema = z.enum(['TODO', 'DOING', 'DONE']);
export const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const TaskSourceSchema = z.enum(['internal', 'planner']);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  due_date: z.string().datetime().nullable(),
  source: TaskSourceSchema,
  external_id: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  due_date: z.string().datetime().optional().nullable(),
  source: TaskSourceSchema.optional(),
  external_id: z.string().optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = CreateTaskSchema.partial();

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export async function getTasks(filters?: {
  status?: Task['status'];
  priority?: Task['priority'];
  source?: Task['source'];
}) {
  let query = supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  return z.array(TaskSchema).parse(data);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch task: ${error.message}`);
  }

  return TaskSchema.parse(data);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const validated = CreateTaskSchema.parse(input);

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...validated,
      due_date: validated.due_date || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return TaskSchema.parse(data);
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<Task> {
  const validated = UpdateTaskSchema.parse(input);

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...validated,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  return TaskSchema.parse(data);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
}

export async function getTasksByDueDate(date: Date): Promise<Task[]> {
  // Convert to UTC for comparison (stored dates are in UTC)
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .gte('due_date', startOfDay.toISOString())
    .lte('due_date', endOfDay.toISOString())
    .in('status', ['TODO', 'DOING'])
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true })
    .limit(5);

  if (error) {
    throw new Error(`Failed to fetch tasks by due date: ${error.message}`);
  }

  return z.array(TaskSchema).parse(data);
}

export async function getOverdueTasks(): Promise<Task[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .lt('due_date', now)
    .neq('status', 'DONE');

  if (error) {
    throw new Error(`Failed to fetch overdue tasks: ${error.message}`);
  }

  return z.array(TaskSchema).parse(data);
}

export async function getHighPriorityTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('priority', 'HIGH')
    .neq('status', 'DONE');

  if (error) {
    throw new Error(`Failed to fetch high priority tasks: ${error.message}`);
  }

  return z.array(TaskSchema).parse(data);
}

export async function getCompletionRate7d(): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: allTasks, error: allError } = await supabase
    .from('tasks')
    .select('status')
    .gte('created_at', sevenDaysAgo.toISOString());

  if (allError) {
    throw new Error(`Failed to fetch tasks: ${allError.message}`);
  }

  const { data: doneTasks, error: doneError } = await supabase
    .from('tasks')
    .select('status')
    .gte('created_at', sevenDaysAgo.toISOString())
    .eq('status', 'DONE');

  if (doneError) {
    throw new Error(`Failed to fetch done tasks: ${doneError.message}`);
  }

  const total = allTasks.length;
  if (total === 0) {
    return 0;
  }

  return Math.round((doneTasks.length / total) * 100);
}
