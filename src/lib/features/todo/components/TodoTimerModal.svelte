<script lang="ts">
	import { fade } from 'svelte/transition';
	import * as Card from '$lib/components/ui/card';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Clock } from '@lucide/svelte';
	import { todoTimerState } from '../todo.timer.svelte';

	// Reactive countdown string (mm:ss) and milliseconds
	let countdownStr = $state('00:00');
	let remainingMs = $state(0);
	let lessThan15Minutes = $derived(remainingMs <= 15 * 60 * 1000);

	function updateCountdown() {
		if (!todoTimerState.targetTimeMs) {
			countdownStr = '00:00';
			remainingMs = 0;
			return;
		}
		const diffMs = todoTimerState.targetTimeMs - Date.now();
		remainingMs = Math.max(0, diffMs);
		if (diffMs <= 0) {
			countdownStr = '00:00';
		} else {
			const totalSeconds = Math.floor(diffMs / 1000);
			const m = Math.floor(totalSeconds / 60);
			const s = totalSeconds % 60;
			countdownStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
		}
	}

	// Update the countdown string immediately and every second when the modal is open
	$effect(() => {
		if (todoTimerState.isOpen && todoTimerState.targetTimeMs) {
			updateCountdown();
			const interval = setInterval(updateCountdown, 1000);
			return () => clearInterval(interval);
		}
	});
</script>

{#if todoTimerState.isOpen && todoTimerState.activeTodo}
	<div
		role="presentation"
		aria-hidden="true"
		class="fixed inset-0 z-50 bg-background/50 backdrop-blur-xs transition-all duration-200"
		transition:fade={{ duration: 200 }}
		aria-label="Timer backdrop"
	></div>

	<div
		class="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
		transition:fade={{ duration: 200 }}
	>
		<Card.Root
			class="mx-auto gap-8 overflow-hidden border-primary/20 shadow-xl ring-2 ring-primary/20"
		>
			<Card.Header class="relative flex flex-col items-center justify-center">
				<Card.Title class="line-clamp-2 text-center text-xl font-medium">
					{todoTimerState.activeTodo.title}
				</Card.Title>
				<Card.Description>Upcoming Task</Card.Description>
			</Card.Header>
			<Card.Content class="relative">
				<p class="text-center text-5xl font-bold tracking-tighter text-primary">{countdownStr}</p>
			</Card.Content>
			<Card.Footer class="flex flex-col gap-2">
				{#if !lessThan15Minutes}
					<Button
						variant="default"
						class="gap-2"
						onclick={() => todoTimerState.snoozeActiveFor15Mins()}
					>
						<Clock size={16} />
						Snooze
					</Button>
				{/if}
				<Button
					variant="link"
					class="gap-2 text-foreground"
					onclick={() => todoTimerState.stopTimerForActive()}
				>
					Stop
				</Button>
			</Card.Footer>
		</Card.Root>
	</div>
{/if}
