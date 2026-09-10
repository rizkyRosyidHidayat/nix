import { TodoPriority, type Todo } from './todo.type';
import { db } from '$lib/db/database';

const PRIORITY_ORDER: Record<TodoPriority, number> = {
  [TodoPriority.high]: 1,
  [TodoPriority.medium]: 2,
  [TodoPriority.low]: 3
};

function getDueDateTime(todo: Todo): number | null {
  if (!todo.dueDate) return null;
  const timeStr = todo.endTime ? (todo.endTime.length === 5 ? `${todo.endTime}:00` : todo.endTime) : '23:59:59';
  const timestamp = new Date(`${todo.dueDate}T${timeStr}`).getTime();
  return isNaN(timestamp) ? new Date(todo.dueDate).getTime() : timestamp;
}

export class TodoRepository {
  async create(todo: Todo): Promise<Todo> {
    await db.todos.add(todo);
    return todo;
  }

  async list(): Promise<Todo[]> {
    return db.todos.orderBy('createdAt').reverse().toArray();
  }

  async listByDate(date: string): Promise<Todo[]> {
    // filter by start date, due date, or created date
    return db.todos
      .filter((todo) => {
        const filterDate = new Date(date).getTime();
        const startDate = todo.startDate ? new Date(todo.startDate).getTime() : 0;
        const dueDate = todo.dueDate ? new Date(todo.dueDate).getTime() : 0;
        const createdDate = new Date(todo.createdAt.split('T')[0]).getTime();
        return dueDate
          ? dueDate === filterDate
          : startDate
            ? startDate === filterDate
            : createdDate === filterDate;
      })
      .reverse()
      .toArray();
  }

  async listUpcomingTodos(): Promise<Todo[]> {
    // order by nearest due date/endtime, priority, and then created date (all ascending)
    const items = await db.todos
      .filter((todo) => !todo.isCompleted)
      .toArray();

    return items.sort((a, b) => {
      const dueA = getDueDateTime(a);
      const dueB = getDueDateTime(b);

      // 1. Due date / End time (nearest first)
      if (dueA !== null && dueB !== null) {
        if (dueA !== dueB) return dueA - dueB;
      } else if (dueA !== null) {
        return -1;
      } else if (dueB !== null) {
        return 1;
      }

      // 2. Priority (high -> medium -> low -> none)
      const priorityA = a.priority ? (PRIORITY_ORDER[a.priority] ?? 4) : 4;
      const priorityB = b.priority ? (PRIORITY_ORDER[b.priority] ?? 4) : 4;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 3. Created date (ascending)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
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