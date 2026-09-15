import { browser } from '$app/environment';
import * as chrono from 'chrono-node';
import type { Todo, TodoCreateDto, TodoUpdateDto, TodoDateGroup } from './todo.type';
import { TodoPriority, TodoInterval, TodoStatus } from './todo.type';
import { todoRepository, type TodoRepository } from './todo.repository';
import type { ReturnType } from '$lib/utils';
import { SvelteDate, SvelteMap } from 'svelte/reactivity';

const PRIORITY_ORDER: Record<TodoPriority, number> = {
	[TodoPriority.high]: 1,
	[TodoPriority.medium]: 2,
	[TodoPriority.low]: 3
};

export function formatTodoDateGroupLabel(dateStr: string): { dateLabel: string; formattedDate: string } {
	if (!dateStr) return { dateLabel: 'No Date', formattedDate: '' };

	const parts = dateStr.split('T')[0].split('-');
	if (parts.length < 3) return { dateLabel: dateStr, formattedDate: dateStr };

	const [y, m, d] = parts.map(Number);
	const target = new SvelteDate(y, m - 1, d);
	if (isNaN(target.getTime())) return { dateLabel: dateStr, formattedDate: dateStr };

	const today = new SvelteDate();
	today.setHours(0, 0, 0, 0);

	const targetZero = new SvelteDate(target);
	targetZero.setHours(0, 0, 0, 0);

	const diffDays = Math.round((targetZero.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

	const formattedDate = target.toLocaleDateString(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});

	let dateLabel = formattedDate;
	if (diffDays === 0) {
		dateLabel = 'Today';
	} else if (diffDays === 1) {
		dateLabel = 'Tomorrow';
	} else if (diffDays === -1) {
		dateLabel = 'Yesterday';
	} else if (diffDays > 1 && diffDays < 7) {
		dateLabel = target.toLocaleDateString(undefined, { weekday: 'short' });
	}

	return { dateLabel, formattedDate };
}

export function groupTodosByDate(todos: Todo[]): TodoDateGroup[] {
	const map = new SvelteMap<string, Todo[]>();

	for (const todo of todos) {
		const dateKey = todo.createdAt ? todo.createdAt.split('T')[0] : '';

		if (!map.has(dateKey)) {
			map.set(dateKey, []);
		}
		map.get(dateKey)!.push(todo);
	}

	return Array.from(map.entries()).map(([date, items]) => {
		const { dateLabel, formattedDate } = formatTodoDateGroupLabel(date);
		return {
			date,
			dateLabel,
			formattedDate,
			todos: items
		};
	});
}

function getDueDateTime(todo: Todo): number | null {
	if (!todo.dueDate) return null;
	const timeStr = todo.endTime
		? todo.endTime.length === 5
			? `${todo.endTime}:00`
			: todo.endTime
		: '23:59:59';
	const timestamp = new Date(`${todo.dueDate}T${timeStr}`).getTime();
	return isNaN(timestamp) ? new Date(todo.dueDate).getTime() : timestamp;
}

function matchesDate(todo: Todo, targetDate: string): boolean {
	if (!targetDate) return false;
	const filterDate = new Date(targetDate).getTime();
	const createdDate = new Date(todo.createdAt.split('T')[0]).getTime();
	return createdDate === filterDate;
}

function formatDateStr(d: Date): string {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function getNextRepeatDate(fromDateStr: string, interval: TodoInterval): string {
	const from = new SvelteDate(fromDateStr + 'T00:00:00');

	switch (interval) {
		case TodoInterval.day: {
			from.setDate(from.getDate() + 1);
			return formatDateStr(from);
		}
		case TodoInterval.weekday: {
			// Advance to next Mon-Fri
			do {
				from.setDate(from.getDate() + 1);
			} while (from.getDay() === 0 || from.getDay() === 6);
			return formatDateStr(from);
		}
		case TodoInterval.weekend: {
			// Advance to next Sat or Sun
			do {
				from.setDate(from.getDate() + 1);
			} while (from.getDay() !== 0 && from.getDay() !== 6);
			return formatDateStr(from);
		}
		default:
			from.setDate(from.getDate() + 1);
			return formatDateStr(from);
	}
}

export class TodoState {
	private repository: TodoRepository;
	public selectedDate = $state<string>(new SvelteDate().toISOString().split('T')[0]);

	// Single source of truth for all todos
	public todos: ReturnType<Todo[]> = $state({
		isLoading: true,
		data: [],
		state: 'pending'
	});

	// Derived reactive view: Incomplete todos sorted by due date, priority, and creation time
	public upcomingTodos: ReturnType<Todo[]> = $derived.by(() => {
		const items = this.todos.data.filter((todo) => !todo.isCompleted);
		const sorted = [...items].sort((a, b) => {
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
			const priorityA = a.priority ? PRIORITY_ORDER[a.priority] ?? 4 : 4;
			const priorityB = b.priority ? PRIORITY_ORDER[b.priority] ?? 4 : 4;
			if (priorityA !== priorityB) {
				return priorityA - priorityB;
			}

			// 3. Created date (ascending)
			const dateA = a.dueDate || a.startDate || a.createdAt;
			const dateB = b.dueDate || b.startDate || b.createdAt;
			return new SvelteDate(dateA).getTime() - new SvelteDate(dateB).getTime();
		});

		return {
			isLoading: this.todos.isLoading,
			data: sorted,
			state: this.todos.state,
			error: this.todos.error
		};
	});

	// Derived reactive view: Upcoming incomplete todos grouped by date
	public upcomingTodosGrouped: ReturnType<TodoDateGroup[]> = $derived.by(() => {
		const groups = groupTodosByDate(this.upcomingTodos.data);
		return {
			isLoading: this.todos.isLoading,
			data: groups,
			state: this.todos.state,
			error: this.todos.error
		};
	});

	// Derived reactive view: Todos matching the currently selected date
	public todosByDate: ReturnType<Todo[]> = $derived.by(() => {
		const target = this.selectedDate;
		const items = this.todos.data.filter((todo) => matchesDate(todo, target));

		return {
			isLoading: this.todos.isLoading,
			data: items,
			state: this.todos.state,
			error: this.todos.error
		};
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

	private lastProcessedDate = '';
	private dayCheckInterval: number | NodeJS.Timeout | null = null;

	constructor(repository: TodoRepository = todoRepository) {
		this.repository = repository;
		if (browser) {
			this.refresh();
			this.startDayWatcher();
		}
	}

	private startDayWatcher() {
		this.lastProcessedDate = formatDateStr(new SvelteDate());

		if (this.dayCheckInterval) {
			clearInterval(this.dayCheckInterval);
		}

		// Check periodically if the calendar day has rolled over
		this.dayCheckInterval = setInterval(() => {
			const currentDay = formatDateStr(new SvelteDate());
			if (currentDay !== this.lastProcessedDate) {
				this.lastProcessedDate = currentDay;
				this.processRepeatingTodos();
			}
		}, 30000);

		// Also check on tab visibility change
		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'visible') {
					const currentDay = formatDateStr(new SvelteDate());
					if (currentDay !== this.lastProcessedDate) {
						this.lastProcessedDate = currentDay;
					}
					this.processRepeatingTodos();
				}
			});
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

	private checkDateOrder(
		startDate?: string,
		startTime?: string,
		dueDate?: string,
		endTime?: string
	): ReturnType<undefined> | undefined {
		if (!startDate || !dueDate) return undefined;
		const start = new SvelteDate(`${startDate}T${startTime || '00:00'}`);
		const due = new SvelteDate(`${dueDate}T${endTime || '23:59'}`);
		if (due.getTime() < start.getTime()) {
			return {
				isLoading: false,
				state: 'error',
				data: undefined,
				error: 'Due date/time cannot be earlier than start date/time'
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
		await this.list();
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
		const dateOrderCheck = this.checkDateOrder(startDate, startTime, dueDate, endTime);
		if (dateOrderCheck) return dateOrderCheck;

		return this.create({
			title: raw.title.trim(),
			notes: raw.notes || undefined,
			createdAt: new SvelteDate().toISOString(),
			startDate,
			startTime,
			dueDate,
			endTime,
			interval: raw.repeat ? (raw.repeat.trim().toLowerCase() as unknown as TodoInterval) : undefined,
			priority: raw.priority
				? (raw.priority.trim().toLowerCase() as unknown as TodoPriority)
				: undefined
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
		const dateOrderCheck = this.checkDateOrder(startDate, startTime, dueDate, endTime);
		if (dateOrderCheck) return dateOrderCheck;

		return this.update(id, {
			...(raw.title !== undefined ? { title: raw.title.trim() } : {}),
			notes: raw.notes !== undefined ? (raw.notes ? raw.notes.trim() : undefined) : undefined,
			startDate,
			startTime,
			dueDate,
			endTime,
			interval: raw.repeat ? (raw.repeat.trim().toLowerCase() as unknown as TodoInterval) : undefined,
			priority: raw.priority
				? (raw.priority.trim().toLowerCase() as unknown as TodoPriority)
				: undefined,
			updatedAt: new SvelteDate().toISOString()
		});
	}

	async create(dto: TodoCreateDto): Promise<ReturnType<Todo | undefined>> {
		this.createMutation.isLoading = true;
		const todo: Todo = {
			id: crypto.randomUUID(),
			title: dto.title,
			status: TodoStatus.pending,
			isCompleted: false,
			createdAt: dto.createdAt,
			updatedAt: new SvelteDate().toISOString(),
			startDate: dto.startDate,
			startTime: dto.startTime,
			dueDate: dto.dueDate,
			endTime: dto.endTime,
			interval: dto.interval,
			notes: dto.notes,
			priority: dto.priority
		};

		// Optimistic update: place new todo at beginning of list
		const prevTodos = [...this.todos.data];
		this.todos.data = [todo, ...this.todos.data];

		try {
			const created = await this.repository.create(todo);
			this.createMutation = {
				isLoading: false,
				state: 'success',
				data: created
			};
			return this.createMutation;
		} catch (error) {
			// Rollback on error
			this.todos.data = prevTodos;
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
		const targetIndex = this.todos.data.findIndex((t) => t.id === id);
		const previousTodo = targetIndex !== -1 ? { ...this.todos.data[targetIndex] } : undefined;

		// Optimistic update in-memory
		if (targetIndex !== -1 && previousTodo) {
			const updated: Todo = {
				...previousTodo,
				...dto,
				updatedAt: dto.updatedAt || new SvelteDate().toISOString()
			};
			this.todos.data[targetIndex] = updated;
		}

		try {
			const updated = await this.repository.update(id, dto);
			// Ensure updated state is reflected
			if (targetIndex !== -1) {
				this.todos.data[targetIndex] = updated;
			}
			this.updateMutation = {
				isLoading: false,
				state: 'success',
				data: updated
			};
			this.todo = {
				isLoading: false,
				state: 'success',
				data: updated
			};
			return this.updateMutation;
		} catch (error) {
			// Rollback on error
			if (targetIndex !== -1 && previousTodo) {
				this.todos.data[targetIndex] = previousTodo;
			}
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
		try {
			const items = await this.repository.list();
			this.todos = {
				isLoading: false,
				state: 'success',
				data: items
			};
			await this.processRepeatingTodos();
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
		if (this.todos.isLoading && this.todos.data.length === 0) {
			await this.list();
		}
		return this.upcomingTodos;
	}

	async listByDate(date: string): Promise<ReturnType<Todo[]>> {
		this.selectedDate = date;
		if (this.todos.isLoading && this.todos.data.length === 0) {
			await this.list();
		}
		return this.todosByDate;
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

		// Look up in memory first
		const inMemory = this.todos.data.find((t) => t.id === id);
		if (inMemory) {
			this.todo = {
				isLoading: false,
				state: 'success',
				data: inMemory
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
			status: TodoStatus.done,
			completedAt: new SvelteDate().toISOString()
		});
	}

	public async processRepeatingTodos(): Promise<void> {
		const todos = this.todos.data;
		if (!todos || todos.length === 0) return;

		const todayStr = formatDateStr(new SvelteDate());

		// Group recurring todos by title and interval to find the latest in each chain
		const recurringGroups = new SvelteMap<string, Todo[]>();
		for (const todo of todos) {
			if (todo.interval) {
				const key = `${todo.title.trim().toLowerCase()}_${todo.interval}`;
				if (!recurringGroups.has(key)) {
					recurringGroups.set(key, []);
				}
				recurringGroups.get(key)!.push(todo);
			}
		}

		for (const [, items] of recurringGroups) {
			// Find the latest todo in this repeating series
			const latestTodo = items.reduce((latest, current) => {
				const latestDate =
					latest.startDate ||
					latest.dueDate ||
					(latest.createdAt ? latest.createdAt.split('T')[0] : '');
				const currentDate =
					current.startDate ||
					current.dueDate ||
					(current.createdAt ? current.createdAt.split('T')[0] : '');
				return currentDate > latestDate ? current : latest;
			});

			const interval = latestTodo.interval;
			if (!interval) continue;

			let latestDateStr =
				latestTodo.startDate ||
				latestTodo.dueDate ||
				(latestTodo.createdAt ? latestTodo.createdAt.split('T')[0] : '');

			if (!latestDateStr) continue;

			let nextDate = getNextRepeatDate(latestDateStr, interval);

			while (nextDate <= todayStr) {
				// Check if an occurrence for nextDate already exists in the items for this chain
				const alreadyExists = this.todos.data.some((t) => {
					if (t.title.trim().toLowerCase() !== latestTodo.title.trim().toLowerCase()) return false;
					const tDate = t.startDate || t.dueDate || (t.createdAt ? t.createdAt.split('T')[0] : '');
					return tDate === nextDate;
				});

				if (!alreadyExists) {
					// Preserve duration between startDate and dueDate if applicable
					let nextDueDate: string | undefined;
					if (latestTodo.dueDate) {
						if (latestTodo.startDate && latestTodo.dueDate !== latestTodo.startDate) {
							const startMs = new SvelteDate(latestTodo.startDate + 'T00:00:00').getTime();
							const dueMs = new SvelteDate(latestTodo.dueDate + 'T00:00:00').getTime();
							const durationMs = dueMs - startMs;
							const nextDue = new SvelteDate(
								new SvelteDate(nextDate + 'T00:00:00').getTime() + durationMs
							);
							nextDueDate = formatDateStr(nextDue);
						} else {
							nextDueDate = nextDate;
						}
					}

					await this.create({
						title: latestTodo.title,
						notes: latestTodo.notes,
						priority: latestTodo.priority,
						interval: latestTodo.interval,
						startDate: latestTodo.startDate ? nextDate : undefined,
						startTime: latestTodo.startTime,
						dueDate: nextDueDate,
						endTime: latestTodo.endTime,
						createdAt: new SvelteDate(nextDate + 'T00:00:00').toISOString()
					});
				}

				latestDateStr = nextDate;
				nextDate = getNextRepeatDate(latestDateStr, interval);
			}
		}
	}

	async incomplete(id: string): Promise<ReturnType<Todo | undefined>> {
		return this.update(id, {
			isCompleted: false,
			status: TodoStatus.pending,
			completedAt: undefined
		});
	}

	async delete(id: string): Promise<ReturnType<void>> {
		this.deleteMutation.isLoading = true;
		const targetIndex = this.todos.data.findIndex((t) => t.id === id);
		const removedTodo = targetIndex !== -1 ? this.todos.data[targetIndex] : undefined;

		// Optimistic removal
		if (targetIndex !== -1) {
			this.todos.data.splice(targetIndex, 1);
		}

		try {
			await this.repository.delete(id);
			this.deleteMutation = {
				isLoading: false,
				state: 'success',
				data: undefined
			};
			return this.deleteMutation;
		} catch (err) {
			// Rollback on error
			if (targetIndex !== -1 && removedTodo) {
				this.todos.data.splice(targetIndex, 0, removedTodo);
			}
			this.deleteMutation = {
				isLoading: false,
				state: 'error',
				data: undefined,
				error: err instanceof Error ? err.message : String(err)
			};
			return this.deleteMutation;
		}
	}
}

export const todoState = new TodoState();

