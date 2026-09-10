<script lang="ts">
	import TodoItem from '$lib/features/todo/components/TodoItem.svelte';
	import type { Todo } from '$lib/features/todo';

	const MAX_VISIBLE = 3;
	let { todos } = $props<{ todos: Todo[] }>();
	let expandedItems = $state<Record<string, boolean>>({});
	let isHovering = $state(false);
	let isAnyExpanded = $derived(Object.values(expandedItems).some(Boolean));
	let isListHovered = $derived(isHovering || isAnyExpanded);
	let visibleTodos = $derived(isListHovered ? todos : todos.slice(0, MAX_VISIBLE));
	let itemHeights = $state<number[]>([]);
	let hiddenCount = $derived(Math.max(0, todos.length - MAX_VISIBLE));
	let hasHidden = $derived(todos.length > MAX_VISIBLE);
</script>

<div
	class="relative w-full"
	role="list"
	aria-label="Today's todos"
	onmouseenter={() => (isHovering = true)}
	onmouseleave={() => (isHovering = false)}
>
	<!-- Sonner-style stacked list -->
	<div class="relative transition-all duration-300">
		{#each visibleTodos as todo, idx (todo.id)}
			<div
				class="w-full transition-all duration-300"
				bind:clientHeight={itemHeights[idx]}
				style="
				{!isListHovered && idx > 0
					? `margin-top: -${itemHeights[idx - 1] || 72}px;
            transform: translateY(${idx * 15}px) scale(${1 - idx * 0.04});
            z-index: ${MAX_VISIBLE - idx};
            pointer-events: none;`
					: `margin-top: ${idx > 0 ? '16px' : '0'};
            transform: translateY(0) scale(1);
            z-index: ${MAX_VISIBLE + 1};
            pointer-events: auto;`}
            position: relative;
            transform-origin: top center;
          "
			>
				<div class="w-full">
					<TodoItem {todo} bind:isExpanded={expandedItems[todo.id]} />
				</div>
			</div>
		{/each}
	</div>

	<!-- View all / show less toggle -->
	{#if hasHidden && !isListHovered}
		<div class="flex justify-center transition-all duration-300 {isListHovered ? 'mt-4' : 'mt-10'}">
			<button
				class="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
			>
				<span>+{hiddenCount} more</span>
			</button>
		</div>
	{/if}
</div>
