<script lang="ts">
	import QuickAction from '$lib/components/global/QuickAction.svelte';
	import Container from '$lib/components/global/Container.svelte';
	import { todoState } from '$lib/features/todo';
	import { globalState } from '$lib/stores/global.svelte';
	import TodoStackedList from '$lib/features/todo/components/TodoStackedList.svelte';

	let todos = $derived(todoState.upcomingTodos.data);
	let groupedTodos = $derived(todoState.upcomingTodosGrouped.data);
	let isLoading = $derived(todoState.upcomingTodos.isLoading);

	$effect(() => {
		if (globalState.getIsFirstAddTodo()) {
			const timer = setTimeout(() => {
				globalState.setIsFirstAddTodo(false);
			}, 2000);
			return () => clearTimeout(timer);
		}
	});
</script>

{#if isLoading}
	<Container>
		<h1 class="text-center text-xl leading-relaxed text-muted-foreground">Loading your tasks...</h1>
	</Container>
{:else if todos.length === 0}
	<Container>
		<h1 class="mb-2 text-center text-3xl font-bold">What's on your mind today?</h1>
		<QuickAction />
		<p class="text-center text-sm text-muted-foreground/70">
			Nix is your simple, offline-first task manager.
		</p>
	</Container>
{:else if todos.length === 1 && globalState.getIsFirstAddTodo()}
	<Container>
		<h1 class="text-center text-3xl font-bold">You're all set! Let's get things done.</h1>
	</Container>
{:else}
	<Container class="max-w-md">
		<h1 class="mb-2 text-center text-3xl font-bold">Your Pending Tasks</h1>

		<TodoStackedList {todos} {groupedTodos} />
	</Container>
{/if}
