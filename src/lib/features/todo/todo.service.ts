import type { Todo, TodoCreateDto, TodoUpdateDto, TodoInterval, TodoPriority } from './todo.type';
import { todoRepository, type TodoRepository } from './todo.repository';
import * as chrono from 'chrono-node';

export class TodoService {
  constructor(
    private repository: TodoRepository,
  ) { }

  private parseDateTime(raw: string | undefined): { date?: string; time?: string } {
    if (!raw) return {};
    const parsed = chrono.parseDate(raw);
    if (!parsed) return {};
    const date = parsed.toISOString().split('T')[0];
    const hours = parsed.getHours();
    const minutes = parsed.getMinutes();
    // Only include time if it was explicitly set (not midnight default)
    const hasTime = hours !== 0 || minutes !== 0;
    const time = hasTime
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      : undefined;
    return { date, time };
  }

  private parseInterval(raw: string | undefined): TodoInterval | undefined {
    if (!raw) return undefined;
    const normalized = raw.trim().toLowerCase();
    const map: Record<string, TodoInterval> = {
      day: 'everyday',
      everyday: 'everyday',
      weekday: 'weekday',
      weekdays: 'weekday',
      weekend: 'weekend',
      weekends: 'weekend',
    };
    return map[normalized]; // returns undefined if no match
  }

  private parsePriority(raw: string | undefined): TodoPriority | undefined {
    if (!raw) return undefined;
    const normalized = raw.trim().toLowerCase();
    if (['low', 'medium', 'high'].includes(normalized)) {
      return normalized as TodoPriority;
    }
    return undefined; // silently ignores invalid input
  }

  async createFromCommand(raw: {
    title: string;
    notes?: string;
    dateTime?: string;
    deadline?: string;
    repeat?: string;
    priority?: string;
  }): Promise<Todo> {
    const { date: startDate, time: startTime } = this.parseDateTime(raw.dateTime);
    const { date: dueDate, time: endTime } = this.parseDateTime(raw.deadline);

    return this.create({
      title: raw.title.trim(),
      notes: raw.notes || undefined,
      startDate,
      startTime,
      dueDate,
      endTime,
      interval: this.parseInterval(raw.repeat),
      priority: this.parsePriority(raw.priority),
    });
  }

  async create(dto: TodoCreateDto): Promise<Todo> {
    const todo: Todo = {
      id: crypto.randomUUID(),
      title: dto.title,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: dto.startDate,
      startTime: dto.startTime,
      dueDate: dto.dueDate,
      endTime: dto.endTime,
      interval: dto.interval,
      notes: dto.notes,
      priority: dto.priority,
    };

    const created = await this.repository.create(todo);

    return created;
  }

  async update(id: string, dto: TodoUpdateDto): Promise<Todo> {
    const updated = await this.repository.update(id, dto);

    return updated;
  }

  async list(): Promise<Todo[]> {
    return (await this.repository.list()).sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  async listByDate(date: string): Promise<Todo[]> {
    return (await this.repository.listByDate(date)).sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  async complete(id: string): Promise<Todo> {
    const updated = await this.repository.update(id, {
      isCompleted: true,
      completedAt: new Date().toISOString()
    });

    return updated;
  }

  async uncomplete(id: string): Promise<Todo> {
    const updated = await this.repository.update(id, {
      isCompleted: false,
      completedAt: undefined
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

export const todoService = new TodoService(todoRepository);