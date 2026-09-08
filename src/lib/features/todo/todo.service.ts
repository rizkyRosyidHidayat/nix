import type { Todo, TodoCreateDto, TodoUpdateDto } from './todo.type';
import { todoRepository, type TodoRepository } from './todo.repository';

export class TodoService {
  constructor(
    private repository: TodoRepository,
  ) { }

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