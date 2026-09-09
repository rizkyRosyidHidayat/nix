import { browser } from '$app/environment';
import * as chrono from 'chrono-node';
import type { Todo, TodoCreateDto, TodoUpdateDto } from './todo.type';
import { TodoPriority, TodoInterval } from './todo.type';
import { todoRepository, type TodoRepository } from './todo.repository';
import type { ReturnState, ReturnType } from '$lib/utils';
import { SvelteDate } from 'svelte/reactivity';

export class TodoState {
  private repository: TodoRepository;
  private isLoading = $state<boolean>(true);
  private state = $state<ReturnState>('pending');
  private dataList = $state<Todo[]>([]);
  private dataDetail = $state<Todo | undefined>(undefined);
  private error = $state<string | undefined>(undefined);

  constructor(repository: TodoRepository = todoRepository) {
    this.repository = repository;
    if (browser) {
      this.list();
    }
  }

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

  async createFromCommand(raw: {
    title: string;
    notes?: string;
    dateTime?: string;
    deadline?: string;
    repeat?: string;
    priority?: string;
  }): Promise<ReturnType<Todo | undefined>> {
    const { date: startDate, time: startTime } = this.parseDateTime(raw.dateTime);
    const { date: dueDate, time: endTime } = this.parseDateTime(raw.deadline);

    return this.create({
      title: raw.title.trim(),
      notes: raw.notes || undefined,
      startDate,
      startTime,
      dueDate,
      endTime,
      interval: raw.repeat?.trim().toLowerCase() as unknown as TodoInterval,
      priority: raw.priority?.trim().toLowerCase() as unknown as TodoPriority,
    });
  }

  async updateFromCommand(
    id: string,
    raw: {
      title?: string;
      notes?: string;
      dateTime?: string;
      deadline?: string;
      repeat?: string;
      priority?: string;
    }
  ): Promise<ReturnType<Todo>> {
    const { date: startDate, time: startTime } = this.parseDateTime(raw.dateTime);
    const { date: dueDate, time: endTime } = this.parseDateTime(raw.deadline);

    const interval = raw.repeat
      ? (raw.repeat.trim().toLowerCase() as unknown as TodoInterval)
      : undefined;

    if (interval && !Object.values(TodoInterval).includes(interval)) {
      return {
        isLoading: false,
        state: 'error',
        data: this.dataList.find((t) => t.id === id) as Todo,
        error: `Interval must be one of: ${Object.values(TodoInterval).join(', ')}`
      };
    }

    const priority = raw.priority
      ? (raw.priority.trim().toLowerCase() as unknown as TodoPriority)
      : undefined;

    if (priority && !Object.values(TodoPriority).includes(priority)) {
      return {
        isLoading: false,
        state: 'error',
        data: this.dataList.find((t) => t.id === id) as Todo,
        error: `Priority must be one of: ${Object.values(TodoPriority).join(', ')}`
      };
    }

    return this.update(id, {
      ...(raw.title !== undefined ? { title: raw.title.trim() } : {}),
      notes: raw.notes !== undefined ? (raw.notes ? raw.notes.trim() : undefined) : undefined,
      startDate,
      startTime,
      dueDate,
      endTime,
      interval,
      priority,
      updatedAt: new SvelteDate().toISOString()
    });
  }

  async create(dto: TodoCreateDto): Promise<ReturnType<Todo | undefined>> {
    const todo: Todo = {
      id: crypto.randomUUID(),
      title: dto.title,
      isCompleted: false,
      createdAt: new SvelteDate().toISOString(),
      updatedAt: new SvelteDate().toISOString(),
      startDate: dto.startDate,
      startTime: dto.startTime,
      dueDate: dto.dueDate,
      endTime: dto.endTime,
      interval: dto.interval,
      notes: dto.notes,
      priority: dto.priority,
    };

    if (todo.interval && !Object.values(TodoInterval).includes(todo.interval)) {
      return {
        isLoading: false,
        state: 'error',
        data: undefined,
        error: `Interval must be one of: ${Object.values(TodoInterval).join(', ')}`
      };
    }

    if (todo.priority && !Object.values(TodoPriority).includes(todo.priority)) {
      return {
        isLoading: false,
        state: 'error',
        data: undefined,
        error: `Priority must be one of: ${Object.values(TodoPriority).join(', ')}`
      };
    }

    this.dataDetail = await this.repository.create(todo);

    await this.list();

    return {
      isLoading: false,
      state: 'success',
      data: this.dataDetail
    };
  }

  async update(id: string, dto: TodoUpdateDto): Promise<ReturnType<Todo>> {
    const updated = await this.repository.update(id, dto);

    this.dataList = this.dataList.map((todo) => {
      if (todo.id === id) {
        return updated;
      }
      return todo;
    });

    if (this.dataDetail?.id === id) {
      this.dataDetail = updated;
    }

    return {
      isLoading: false,
      state: 'success',
      data: updated
    };
  }

  async list(): Promise<ReturnType<Todo[]>> {
    this.dataList = await new Promise<Todo[]>((resolve) =>
      setTimeout(async () => {
        const todoList = (await this.repository.list()).sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            return new SvelteDate(a.dueDate).getTime() - new SvelteDate(b.dueDate).getTime();
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return new SvelteDate(a.createdAt).getTime() - new SvelteDate(b.createdAt).getTime();
        });
        resolve(todoList);
      }, 500)
    );
    this.isLoading = false;

    return {
      isLoading: this.isLoading,
      state: 'success',
      data: this.dataList
    };
  }

  async listByDate(date: string): Promise<ReturnType<Todo[]>> {
    this.dataList = await new Promise<Todo[]>((resolve) =>
      setTimeout(async () => {
        const todoList = (await this.list()).data.filter((todo) => todo.startDate === date);
        resolve(todoList);
      }, 500)
    );

    return {
      isLoading: this.isLoading,
      state: 'success',
      data: this.dataList
    };
  }

  async detail(id: string): Promise<ReturnType<Todo | undefined>> {
    this.dataDetail = await new Promise<Todo | undefined>((resolve) =>
      setTimeout(async () => {
        const todo = await this.repository.getById(id);
        resolve(todo);
      }, 500)
    );
    this.isLoading = false;

    return {
      isLoading: this.isLoading,
      state: 'success',
      data: this.dataDetail
    };
  }

  async complete(id: string): Promise<ReturnType<Todo>> {
    const updated = await this.update(id, {
      isCompleted: true,
      completedAt: new SvelteDate().toISOString()
    });

    return updated;
  }

  async incomplete(id: string): Promise<ReturnType<Todo>> {
    const updated = await this.update(id, {
      isCompleted: false,
      completedAt: undefined
    });

    return updated;
  }

  async delete(id: string): Promise<ReturnType<void>> {
    await this.repository.delete(id);
    this.dataList = this.dataList.filter((todo) => todo.id !== id);
    this.dataDetail = this.dataDetail?.id === id ? undefined : this.dataDetail;

    return {
      isLoading: false,
      state: 'success',
      data: undefined
    };
  }

  getTodos() {
    return this.dataList;
  }

  getTodo() {
    return this.dataDetail;
  }

  getIsLoading() {
    return this.isLoading;
  }

  getState() {
    return this.state;
  }

  getError() {
    return this.error;
  }
}

export const todoState = new TodoState();
