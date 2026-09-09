import type { Todo } from './todo.type';
import { db } from '$lib/db/database';

export class TodoRepository {
  async create(todo: Todo): Promise<Todo> {
    await db.todos.add(todo);
    return todo;
  }

  async list(): Promise<Todo[]> {
    return db.todos.orderBy('createdAt').reverse().toArray();
  }

  async listByDate(date: string): Promise<Todo[]> {
    return (await this.list()).filter((todo) => todo.startDate === date);
  }

  async getById(id: string): Promise<Todo | undefined> {
    return db.todos.get(id);
  }

  async update(id: string, changes: Partial<Todo>): Promise<Todo> {
    const current = await this.getById(id);
    if (!current) throw new Error('Todo not found');
    const updatedTodo: Todo = { ...current, ...changes };
    for (const key of Object.keys(changes) as (keyof Todo)[]) {
      if (changes[key] === undefined) {
        delete updatedTodo[key];
      }
    }
    await db.todos.put(updatedTodo);
    return updatedTodo;
  }

  async delete(id: string): Promise<void> {
    await db.todos.delete(id);
  }
}

export const todoRepository = new TodoRepository();