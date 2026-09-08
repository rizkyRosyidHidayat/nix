export type TodoInterval = 'everyday' | 'weekday' | 'weekend' | 'custom';

export type TodoPriority = 'low' | 'medium' | 'high';

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