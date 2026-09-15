export enum TodoInterval {
  day = 'day',
  weekday = 'weekday',
  weekend = 'weekend'
};

export enum TodoPriority {
  low = 'low',
  medium = 'medium',
  high = 'high'
};

export enum TodoStatus {
  pending = 'pending',
  inProgress = 'in-progress',
  done = 'done',
  overdue = 'overdue'
}

export interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  startTime?: string;
  dueDate?: string;
  endTime?: string;
  interval?: TodoInterval;
  notes?: string;
  priority?: TodoPriority;
  completedAt?: string;
}

export type TodoCreateDto = Omit<
  Todo,
  'id' | 'updatedAt' | 'isCompleted' | 'completedAt' | 'status'
>;

export type TodoUpdateDto = Partial<Omit<Todo, 'id' | 'createdAt'>>;

export interface TodoDateGroup {
  date: string;
  dateLabel: string;
  formattedDate: string;
  todos: Todo[];
}
