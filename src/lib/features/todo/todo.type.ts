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

export interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
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
  'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'completedAt'
>;

export type TodoUpdateDto = Partial<Omit<Todo, 'id' | 'createdAt'>>;