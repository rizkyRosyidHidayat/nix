<script lang="ts">
	import TodoItem from '$lib/features/todo/components/TodoItem.svelte';
	import type { Todo, TodoDateGroup } from '$lib/features/todo';
	import { groupTodosByDate } from '$lib/features/todo';
	import { Calendar } from '@lucide/svelte';
	import { SvelteMap } from 'svelte/reactivity';

	const MAX_VISIBLE = 3;
	let {
		todos = [],
		groupedTodos: propGroupedTodos
	}: {
		todos?: Todo[];
		groupedTodos?: TodoDateGroup[];
	} = $props();

	let grouped = $derived(propGroupedTodos ?? groupTodosByDate(todos));
	let allTodos = $derived(propGroupedTodos ? propGroupedTodos.flatMap((g) => g.todos) : todos);

	let todoIndexMap = $derived.by(() => {
		const map = new SvelteMap<string, number>();
		let idx = 0;
		for (const group of grouped) {
			for (const todo of group.todos) {
				map.set(todo.id, idx++);
			}
		}
		return map;
	});

	let expandedItems = $state<Record<string, boolean>>({});
	let isHovering = $state(false);
	let isAnyExpanded = $derived(Object.values(expandedItems).some(Boolean));
	let isListHovered = $derived(isHovering || isAnyExpanded);
	let hiddenCount = $derived(Math.max(0, allTodos.length - MAX_VISIBLE));
	let hasHidden = $derived(allTodos.length > MAX_VISIBLE);

	let hoverTimer: ReturnType<typeof setTimeout> | undefined;

	function onMouseEnter() {
		clearTimeout(hoverTimer);
		isHovering = true;
	}

	function onMouseLeave() {
		clearTimeout(hoverTimer);
		hoverTimer = setTimeout(() => {
			isHovering = false;
		}, 150);
	}
</script>

<div
	class="relative w-full py-1"
	role="list"
	aria-label="Today's todos"
	onmouseenter={onMouseEnter}
	onmouseleave={onMouseLeave}
>
	<!-- Single continuous animated container for seamless transition -->
	<div
		class="flex flex-col transition-all duration-300 ease-out {isListHovered ? 'gap-5' : 'gap-0'}"
	>
		{#each grouped as group (group.date)}
			<div
				class="flex flex-col transition-all duration-300 ease-out {isListHovered
					? 'gap-2'
					: 'gap-0'}"
			>
				<!-- Animated Date Group Header -->
				<div
					class="overflow-hidden transition-all duration-300 ease-out {isListHovered
						? 'max-h-8 translate-y-0 opacity-100'
						: 'pointer-events-none max-h-0 -translate-y-2 opacity-0'}"
				>
					<div class="flex items-center justify-between px-1 pb-1 text-sm text-muted-foreground">
						<div class="flex items-center gap-1.5">
							<Calendar size={16} class="text-primary" />
							<span class="font-medium text-muted-foreground/80">{group.dateLabel}</span>
							{#if group.formattedDate && group.dateLabel !== group.formattedDate}
								<span class="font-normal text-muted-foreground/60">• {group.formattedDate}</span>
							{/if}
						</div>
						<span
							class="rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium text-muted-foreground"
						>
							{group.todos.length}
							{group.todos.length === 1 ? 'task' : 'tasks'}
						</span>
					</div>
				</div>

				<!-- Tasks in this Date Group -->
				<div
					class="flex flex-col transition-all duration-300 ease-out {isListHovered
						? 'gap-2'
						: 'gap-0'}"
				>
					{#each group.todos as todo (todo.id)}
						{@const idx = todoIndexMap.get(todo.id) ?? 0}
						<div
							class="stack-card w-full"
							class:is-hovered={isListHovered}
							class:is-top={idx === 0}
							class:is-stacked={idx > 0 && idx < MAX_VISIBLE}
							class:is-hidden-stack={idx >= MAX_VISIBLE}
							style="
								--stack-idx: {idx};
								--stack-offset: {idx * 14}px;
								--stack-scale: {1 - idx * 0.04};
								--stack-z: {MAX_VISIBLE - idx + 5};
							"
						>
							<div class="w-full">
								<TodoItem {todo} bind:isExpanded={expandedItems[todo.id]} />
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- View all / show less toggle -->
	{#if hasHidden}
		<div
			class="flex justify-center transition-all duration-300 ease-out {isListHovered
				? 'pointer-events-none mt-0 max-h-0 opacity-0'
				: 'mt-8 max-h-12 opacity-100'}"
		>
			<button
				class="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
			>
				<span>+{hiddenCount} more</span>
			</button>
		</div>
	{/if}
	{#if !hasHidden}
		<p
			class="text-center text-sm text-muted-foreground/70 transition-all duration-300 ease-out {isListHovered
				? 'pointer-events-none mt-0 max-h-0 opacity-0'
				: 'max-h-8 opacity-100'}"
			style="margin-top: {allTodos.length * 12}px"
		>
			Hover the todo to expand
		</p>
	{/if}
</div>

<style>
	.stack-card {
		position: relative;
		transform-origin: top center;
		will-change: transform, margin-top, opacity;
		backface-visibility: hidden;
		transition:
			transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
			margin-top 300ms cubic-bezier(0.16, 1, 0.3, 1),
			opacity 300ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* Collapsed states */
	.stack-card:not(.is-hovered).is-top {
		z-index: 10;
		transform: translateY(0) scale(1);
		opacity: 1;
		margin-top: 0;
		pointer-events: auto;
	}

	.stack-card:not(.is-hovered).is-stacked {
		z-index: var(--stack-z);
		margin-top: -52px;
		transform: translateY(var(--stack-offset)) scale(var(--stack-scale));
		opacity: 1;
		pointer-events: auto;
	}

	.stack-card:not(.is-hovered).is-hidden-stack {
		z-index: 0;
		margin-top: -64px;
		transform: translateY(42px) scale(0.88);
		opacity: 0;
		pointer-events: none;
	}

	/* Expanded / Hovered states */
	.stack-card.is-hovered {
		z-index: 1;
		margin-top: 0;
		transform: translateY(0) scale(1);
		opacity: 1;
		pointer-events: auto;
	}
</style>
