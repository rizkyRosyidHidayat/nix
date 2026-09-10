<script lang="ts">
	import QuickAction from '$lib/components/global/QuickAction.svelte';
	import Container from '$lib/components/global/Container.svelte';
	import { todoState } from '$lib/features/todo';
	import { globalState } from '$lib/stores/global.svelte';
	import TodoItem from '$lib/features/todo/components/TodoItem.svelte';

	const MAX_VISIBLE = 3;
	let expandedItems = $state<Record<string, boolean>>({});
	let isHovering = $state(false);
	let isAnyExpanded = $derived(Object.values(expandedItems).some(Boolean));
	let isListHovered = $derived(isHovering || isAnyExpanded);

	let todos = $derived(todoState.upcomingTodos.data);
	let isLoading = $derived(todoState.upcomingTodos.isLoading);
	let isLoadingDeleteMutation = $derived(todoState.deleteMutation.isLoading);
	let isLoadingUpdateMutation = $derived(todoState.updateMutation.isLoading);
	let isLoadingCreateMutation = $derived(todoState.createMutation.isLoading);

	let isLoadingMutations = $derived(
		isLoadingDeleteMutation || isLoadingUpdateMutation || isLoadingCreateMutation
	);

	$effect(() => {
		if (globalState.getIsFirstAddTodo()) {
			const timer = setTimeout(() => {
				globalState.setIsFirstAddTodo(false);
			}, 2000);
			return () => clearTimeout(timer);
		}
	});

	let hiddenCount = $derived(Math.max(0, todos.length - MAX_VISIBLE));
	let hasHidden = $derived(todos.length > MAX_VISIBLE);

	let itemHeights = $state<number[]>([]);
</script>

{#if isLoading && !isLoadingMutations}
	<Container>
		<h1 class="text-center text-xl leading-relaxed text-muted-foreground">Loading...</h1>
	</Container>
{:else if todos.length === 0}
	<Container>
		<h1 class="mb-4 text-center text-3xl font-bold">Hello, let's add your first todo</h1>
		<QuickAction />
		<p class="text-center text-xs text-muted-foreground">Nix is an application for managing todo</p>
	</Container>
{:else if todos.length === 1 && globalState.getIsFirstAddTodo()}
	<Container>
		<h1 class="text-center text-3xl font-bold">Great, start the journey now</h1>
	</Container>
{:else}
	<Container>
		<h1 class="mb-4 text-center text-3xl font-bold">You are on your way</h1>

		<div
			class="relative w-full max-w-md"
			role="list"
			aria-label="Today's todos"
			onmouseenter={() => (isHovering = true)}
			onmouseleave={() => (isHovering = false)}
		>
			<!-- Sonner-style stacked list -->
			<div class="relative transition-all duration-300">
				{#each todos as todo, idx (todo.id)}
					<div
						class="w-full transition-all duration-300 ease-out"
						bind:clientHeight={itemHeights[idx]}
						style="
							{!isListHovered && idx > 0
							? `margin-top: -${itemHeights[idx - 1] || 72}px;
							   transform: translateY(${idx * 15}px) scale(${1 - idx * 0.04});
							   opacity: 1;
							   z-index: ${MAX_VISIBLE - idx};
							   pointer-events: none;`
							: `margin-top: ${idx > 0 ? '16px' : '0'};
							   transform: translateY(0) scale(1);
							   opacity: 1;
							   z-index: ${MAX_VISIBLE + 1};
							   pointer-events: auto;`}
							position: relative;
							transform-origin: top center;
						"
					>
						<TodoItem {todo} bind:isExpanded={expandedItems[todo.id]} />
					</div>
				{/each}
			</div>

			<!-- View all / show less toggle -->
			{#if hasHidden && !isListHovered}
				<div
					class="flex justify-center transition-all duration-300 {isListHovered ? 'mt-4' : 'mt-10'}"
				>
					<button
						class="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
					>
						<span>+{hiddenCount} more</span>
						<span class="opacity-60">· view all</span>
					</button>
				</div>
			{/if}
		</div>
	</Container>
{/if}
