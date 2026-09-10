import { browser } from '$app/environment';
import * as chrono from 'chrono-node';
import type { Todo, TodoCreateDto, TodoUpdateDto } from './todo.type';
import { TodoPriority, TodoInterval } from './todo.type';
import { todoRepository, type TodoRepository } from './todo.repository';
import type { ReturnType } from '$lib/utils';
import { SvelteDate } from 'svelte/reactivity';

export class TodoState {
  private repository: TodoRepository;
  public todos: ReturnType<Todo[]> = $state({
    isLoading: true,
    data: [],
    state: 'pending'
  });
  public upcomingTodos: ReturnType<Todo[]> = $state({
    isLoading: true,
    data: [],
    state: 'pending'
  });
  public todo: ReturnType<Todo | undefined> = $state({
    isLoading: false,
    data: undefined,
    state: 'pending'
  });
  public deleteMutation: ReturnType<void> = $state({
    isLoading: false,
    data: undefined,
    state: 'pending'
  });
  public createMutation: ReturnType<Todo | undefined> = $state({
    isLoading: false,
    data: undefined,
    state: 'pending'
  });
  public updateMutation: ReturnType<Todo | undefined> = $state({
    isLoading: false,
    data: undefined,
    state: 'pending'
  });

  constructor(repository: TodoRepository = todoRepository) {
    this.repository = repository;
    if (browser) {
      this.refresh();
    }
  }

  private checkDateTime(raw: string | undefined): ReturnType<undefined> | undefined {
    if (raw && !this.parseDateTime(raw).date) {
      return {
        isLoading: false,
        state: 'error',
        data: undefined,
        error: `Date invalid, try format DD/MM/YYYY`
      };
    }
  }

  private checkPriority(raw: string | undefined): ReturnType<undefined> | undefined {
    if (!raw) return undefined;
    const priority = raw.trim().toLowerCase() as TodoPriority;
    if (!Object.values(TodoPriority).includes(priority)) {
      return {
        isLoading: false,
        state: 'error',
        data: undefined,
        error: `Priority must be one of: ${Object.values(TodoPriority).join(', ')}`
      };
    }
  }

  private checkInterval(raw: string | undefined): ReturnType<undefined> | undefined {
    if (!raw) return undefined;
    const interval = raw.trim().toLowerCase() as TodoInterval;
    if (!Object.values(TodoInterval).includes(interval)) {
      return {
        isLoading: false,
        state: 'error',
        data: undefined,
        error: `Interval must be one of: ${Object.values(TodoInterval).join(', ')}`
      };
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

  public async refresh(): Promise<void> {
    await Promise.all([this.list(), this.listUpcomingTodos()]);
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

    const dateTimeCheck = this.checkDateTime(raw.dateTime);
    if (dateTimeCheck) return dateTimeCheck;
    const deadlineCheck = this.checkDateTime(raw.deadline);
    if (deadlineCheck) return deadlineCheck;
    const intervalCheck = this.checkInterval(raw.repeat);
    if (intervalCheck) return intervalCheck;
    const priorityCheck = this.checkPriority(raw.priority);
    if (priorityCheck) return priorityCheck;

    return this.create({
      title: raw.title.trim(),
      notes: raw.notes || undefined,
      startDate,
      startTime,
      dueDate,
      endTime,
      interval: raw.repeat ? (raw.repeat.trim().toLowerCase() as unknown as TodoInterval) : undefined,
      priority: raw.priority ? (raw.priority.trim().toLowerCase() as unknown as TodoPriority) : undefined,
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
  ): Promise<ReturnType<Todo | undefined>> {
    const { date: startDate, time: startTime } = this.parseDateTime(raw.dateTime);
    const { date: dueDate, time: endTime } = this.parseDateTime(raw.deadline);

    const dateTimeCheck = this.checkDateTime(raw.dateTime);
    if (dateTimeCheck) return dateTimeCheck;
    const deadlineCheck = this.checkDateTime(raw.deadline);
    if (deadlineCheck) return deadlineCheck;
    const intervalCheck = this.checkInterval(raw.repeat);
    if (intervalCheck) return intervalCheck;
    const priorityCheck = this.checkPriority(raw.priority);
    if (priorityCheck) return priorityCheck;

    return this.update(id, {
      ...(raw.title !== undefined ? { title: raw.title.trim() } : {}),
      notes: raw.notes !== undefined ? (raw.notes ? raw.notes.trim() : undefined) : undefined,
      startDate,
      startTime,
      dueDate,
      endTime,
      interval: raw.repeat ? (raw.repeat.trim().toLowerCase() as unknown as TodoInterval) : undefined,
      priority: raw.priority ? (raw.priority.trim().toLowerCase() as unknown as TodoPriority) : undefined,
      updatedAt: new SvelteDate().toISOString()
    });
  }

  async create(dto: TodoCreateDto): Promise<ReturnType<Todo | undefined>> {
    this.createMutation.isLoading = true;
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
    try {
      const created = await this.repository.create(todo);
      await this.refresh();
      this.createMutation = {
        isLoading: false,
        state: 'success',
        data: created,
      };
      return this.createMutation;
    } catch (error) {
      this.createMutation = {
        isLoading: false,
        state: 'error',
        data: undefined,
        error: error instanceof Error ? error.message : String(error)
      };
      return this.createMutation;
    }
  }

  async update(id: string, dto: TodoUpdateDto): Promise<ReturnType<Todo | undefined>> {
    this.updateMutation.isLoading = true;
    try {
      const updated = await this.repository.update(id, dto);
      await this.refresh();
      this.updateMutation = {
        isLoading: false,
        state: 'success',
        data: updated,
      };
      this.todo = {
        isLoading: false,
        state: 'success',
        data: updated
      };
      return this.updateMutation;
    } catch (error) {
      this.updateMutation = {
        isLoading: false,
        state: 'error',
        data: undefined,
        error: error instanceof Error ? error.message : String(error)
      };
      return this.updateMutation;
    }
  }

  async list(): Promise<ReturnType<Todo[]>> {
    this.todos.isLoading = true;
    try {
      const items = await this.repository.list();
      this.todos = {
        isLoading: false,
        state: 'success',
        data: items
      };
      return this.todos;
    } catch (err) {
      this.todos = {
        isLoading: false,
        state: 'error',
        data: this.todos.data ?? [],
        error: err instanceof Error ? err.message : String(err)
      };
      return this.todos;
    }
  }

  async listUpcomingTodos(): Promise<ReturnType<Todo[]>> {
    this.upcomingTodos.isLoading = true;
    try {
      const items = await this.repository.listUpcomingTodos();
      this.upcomingTodos = {
        isLoading: false,
        state: 'success',
        data: items
      };
      return this.upcomingTodos;
    } catch (err) {
      this.upcomingTodos = {
        isLoading: false,
        state: 'error',
        data: this.upcomingTodos.data ?? [],
        error: err instanceof Error ? err.message : String(err)
      };
      return this.upcomingTodos;
    }
  }

  async listByDate(date: string): Promise<ReturnType<Todo[]>> {
    try {
      const items = await this.repository.listByDate(date);
      return {
        isLoading: false,
        state: 'success',
        data: items
      };
    } catch (err) {
      return {
        isLoading: false,
        state: 'error',
        data: [],
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }

  async detail(id?: string): Promise<ReturnType<Todo | undefined>> {
    if (!id) {
      this.todo = {
        isLoading: false,
        state: 'success',
        data: undefined
      };
      return this.todo;
    }

    this.todo.isLoading = true;
    try {
      const item = await this.repository.getById(id);
      this.todo = {
        isLoading: false,
        state: 'success',
        data: item
      };
      return this.todo;
    } catch (err) {
      this.todo = {
        isLoading: false,
        state: 'error',
        data: undefined,
        error: err instanceof Error ? err.message : String(err)
      };
      return this.todo;
    }
  }

  async complete(id: string): Promise<ReturnType<Todo | undefined>> {
    return this.update(id, {
      isCompleted: true,
      completedAt: new SvelteDate().toISOString()
    });
  }

  async incomplete(id: string): Promise<ReturnType<Todo | undefined>> {
    return this.update(id, {
      isCompleted: false,
      completedAt: undefined
    });
  }

  async delete(id: string): Promise<ReturnType<void>> {
    this.deleteMutation.isLoading = true;
    try {
      await this.repository.delete(id);
      await this.refresh();
    } catch (err) {
      this.deleteMutation = {
        isLoading: false,
        state: 'error',
        data: undefined,
        error: err instanceof Error ? err.message : String(err)
      };
      return this.deleteMutation;
    }

    return {
      isLoading: false,
      state: 'success',
      data: undefined
    };
  }
}

export const todoState = new TodoState();
