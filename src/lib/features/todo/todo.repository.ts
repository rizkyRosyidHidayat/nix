import type { Todo } from './todo.type';
import { db } from '$lib/db/database';
import { dbState } from '$lib/stores/db.svelte';

export class TodoRepository {
  async create(todo: Todo): Promise<Todo> {
    await db.todos.add(todo);
    dbState.notify('todo');
    return todo;
  }

  async list(): Promise<Todo[]> {
    return db.todos.orderBy('createdAt').reverse().toArray();
  }

  async listByDate(date: string): Promise<Todo[]> {
    return db.todos.where('startDate').equals(date).toArray();
  }

  async getById(id: string): Promise<Todo | undefined> {
    return db.todos.get(id);
  }

  async update(id: string, changes: Partial<Todo>): Promise<Todo> {
    await db.todos.update(id, changes);
    dbState.notify('todo');
    const updated = await this.getById(id);
    if (!updated) throw new Error('Todo not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.todos.delete(id);
    dbState.notify('todo');
  }
}

export const todoRepository = new TodoRepository();