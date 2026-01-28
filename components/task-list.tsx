'use client';

import { type Task } from '@/lib/db/tasks';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TaskListProps {
  tasks: Task[];
  onStatusChange?: (id: string, status: Task['status']) => void;
  showActions?: boolean;
}

const statusColors = {
  TODO: 'bg-gray-500',
  DOING: 'bg-blue-500',
  DONE: 'bg-green-500',
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
};

export function TaskList({ tasks, onStatusChange, showActions = true }: TaskListProps) {
  const handleCheckboxChange = (task: Task, checked: boolean) => {
    if (!onStatusChange) return;
    onStatusChange(task.id, checked ? 'DONE' : 'TODO');
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        할일이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
        >
          {showActions && (
            <Checkbox
              checked={task.status === 'DONE'}
              onCheckedChange={(checked) => handleCheckboxChange(task, checked as boolean)}
              className="mt-1"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={task.status === 'DONE' ? 'line-through text-muted-foreground' : 'font-medium'}>
                {task.title}
              </h3>
              <Badge className={statusColors[task.status]}>{task.status}</Badge>
              <Badge variant="outline" className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
            {task.due_date && (
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(task.due_date), 'yyyy-MM-dd HH:mm', { locale: ko })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
