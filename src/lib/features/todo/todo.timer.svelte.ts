import type { Todo } from './todo.type';
import { todoState } from './todo.svelte';

class TodoTimerState {
	// Active todo for the modal
	public activeTodo = $state<Todo | null>(null);
	public targetTimeMs = $state<number | null>(null);
	public isOpen = $state(false);

	// Track stopped/snoozed (persisted in localStorage)
	private stoppedTodos = new Set<string>();
	private snoozedTodos = new Map<string, number>(); // id -> snooze until ms

	private intervalId: ReturnType<typeof setInterval> | undefined;

	constructor() {
		this.loadPersistedState();
	}

	private loadPersistedState() {
		if (typeof window === 'undefined') return;
		try {
			const snoozedRaw = localStorage.getItem('hinix_snoozed_todos');
			if (snoozedRaw) {
				const entries: [string, number][] = JSON.parse(snoozedRaw);
				const now = Date.now();
				// Filter out snoozes that have already expired
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				this.snoozedTodos = new Map(entries.filter(([_, until]) => until > now));
			}
			const stoppedRaw = localStorage.getItem('hinix_stopped_todos');
			if (stoppedRaw) {
				const list: string[] = JSON.parse(stoppedRaw);
				this.stoppedTodos = new Set(list.map(String));
			}
		} catch (e) {
			console.error('Failed to load persisted timer state', e);
		}
	}

	private savePersistedState() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(
				'hinix_snoozed_todos',
				JSON.stringify(Array.from(this.snoozedTodos.entries()))
			);
			localStorage.setItem(
				'hinix_stopped_todos',
				JSON.stringify(Array.from(this.stoppedTodos))
			);
		} catch (e) {
			console.error('Failed to save persisted timer state', e);
		}
	}

	start() {
		if (typeof window === 'undefined') return;
		this.loadPersistedState();
		this.checkTimers(); // Check immediately
		if (!this.intervalId) {
			this.intervalId = setInterval(() => this.checkTimers(), 1000); // Check every second to keep countdown accurate
		}
	}

	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
		}
	}

	private getTargetTimeMs(todo: Todo): number | null {
		// Prefer startTime with its date, then endTime with its date. Only trigger if a specific time is set.
		let dateStr: string | undefined;
		let timeStr: string | undefined;

		if (todo.startDate && todo.startTime) {
			dateStr = todo.startDate;
			timeStr = todo.startTime;
		} else if (todo.dueDate && todo.endTime) {
			dateStr = todo.dueDate;
			timeStr = todo.endTime;
		} else if (todo.startTime) {
			dateStr = todo.startDate || todo.dueDate;
			timeStr = todo.startTime;
		} else if (todo.endTime) {
			dateStr = todo.dueDate || todo.startDate;
			timeStr = todo.endTime;
		}

		if (!dateStr || !timeStr) return null;

		// Ensure timeStr has seconds
		const fullTimeStr = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
		const timestamp = new Date(`${dateStr}T${fullTimeStr}`).getTime();

		return isNaN(timestamp) ? null : timestamp;
	}

	public checkTimers() {
		if (typeof window === 'undefined') return;
		if (todoState.upcomingTodos.isLoading) return;

		const now = Date.now();
		const upcoming = todoState.upcomingTodos.data;

		// If modal is currently open, verify the active todo is still upcoming and incomplete
		if (this.isOpen && this.activeTodo) {
			const activeId = String(this.activeTodo.id);
			const isStillValid = upcoming.some((t) => String(t.id) === activeId && !t.isCompleted);
			if (!isStillValid) {
				this.closeModal();
			}
			return;
		}

		for (const todo of upcoming) {
			const id = String(todo.id);
			if (this.stoppedTodos.has(id)) continue;

			const snoozeUntil = this.snoozedTodos.get(id);
			if (snoozeUntil && now < snoozeUntil) continue;

			const targetMs = this.getTargetTimeMs(todo);
			if (!targetMs) continue;

			const diffMs = targetMs - now;
			const thirtyMinsMs = 30 * 60 * 1000;

			// If it's within 30 minutes
			// Trigger modal if remaining time is between 0 and 30 mins
			if (diffMs > 0 && diffMs <= thirtyMinsMs) {
				this.activeTodo = todo;
				this.targetTimeMs = targetMs;
				this.isOpen = true;
				this.snoozedTodos.delete(id);
				this.savePersistedState();
				break; // Only open for one todo at a time
			}
		}
	}

	stopTimerForActive() {
		if (this.activeTodo) {
			const id = String(this.activeTodo.id);
			this.stoppedTodos.add(id);
			this.snoozedTodos.delete(id);
			this.savePersistedState();
		}
		this.closeModal();
	}

	snoozeActiveFor15Mins() {
		if (this.activeTodo) {
			const id = String(this.activeTodo.id);
			const snoozeUntil = Date.now() + 15 * 60 * 1000;
			this.snoozedTodos.set(id, snoozeUntil);
			this.savePersistedState();
		}
		this.closeModal();
	}

	private closeModal() {
		this.isOpen = false;
		this.activeTodo = null;
		this.targetTimeMs = null;
	}
}

export const todoTimerState = new TodoTimerState();
