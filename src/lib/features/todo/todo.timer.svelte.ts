import type { Todo } from './todo.type';
import { todoState } from './todo.svelte';

class TodoTimerState {
	// Active todo for the modal
	public activeTodo = $state<Todo | null>(null);
	public targetTimeMs = $state<number | null>(null);
	public isOpen = $state(false);

	// Track stopped/snoozed (in memory for now, or could use localStorage)
	private stoppedTodos = new Set<string>();
	private snoozedTodos = new Map<string, number>(); // id -> snooze until ms

	private intervalId: ReturnType<typeof setInterval> | undefined;

	start() {
		if (typeof window === 'undefined') return;
		this.checkTimers(); // Check immediately
		this.intervalId = setInterval(() => this.checkTimers(), 1000); // Check every second to keep countdown accurate
	}

	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
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

	private checkTimers() {
		const now = Date.now();
		const upcoming = todoState.upcomingTodos.data;

		// If modal is currently open, verify the active todo is still upcoming and incomplete
		if (this.isOpen && this.activeTodo) {
			const isStillValid = upcoming.some((t) => t.id === this.activeTodo?.id && !t.isCompleted);
			if (!isStillValid) {
				this.closeModal();
			}
			return;
		}

		for (const todo of upcoming) {
			if (this.stoppedTodos.has(todo.id)) continue;

			const snoozeUntil = this.snoozedTodos.get(todo.id);
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
				this.snoozedTodos.delete(todo.id);
				break; // Only open for one todo at a time
			}
		}
	}

	stopTimerForActive() {
		if (this.activeTodo) {
			this.stoppedTodos.add(this.activeTodo.id);
			this.snoozedTodos.delete(this.activeTodo.id);
		}
		this.closeModal();
	}

	snoozeActiveFor15Mins() {
		if (this.activeTodo) {
			const snoozeUntil = Date.now() + 15 * 60 * 1000;
			this.snoozedTodos.set(this.activeTodo.id, snoozeUntil);
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
