import Dexie, { type Table } from 'dexie';
import type { Todo } from '$lib/features/todo/todo.type';

export class Database extends Dexie {
  todos!: Table<Todo, string>;

  constructor() {
    super('hinix');

    this.version(1).stores({
      todos: 'id, title, isCompleted, createdAt, updatedAt, startDate, startTime, dueTime, endTime, interval, notes, priority'
    });
  }
}
import { browser } from '$app/environment';

export const db = browser ? new Database() : (null as unknown as Database);