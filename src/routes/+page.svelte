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
		<h1 class="text-center text-xl leading-relaxed text-muted-foreground">Loading...</h1>
	</Container>
{:else if todos.length === 0}
	<Container>
		<h1 class="mb-2 text-center text-3xl font-bold">Hello, let's add your first todo</h1>
		<QuickAction />
		<p class="text-center text-xs text-muted-foreground">Nix is an application for managing todo</p>
	</Container>
{:else if todos.length === 1 && globalState.getIsFirstAddTodo()}
	<Container>
		<h1 class="text-center text-3xl font-bold">Great, start the journey now</h1>
	</Container>
{:else}
	<Container class="max-w-md">
		<h1 class="mb-2 text-center text-3xl font-bold">Check You're pending task</h1>

		<TodoStackedList {todos} {groupedTodos} />
	</Container>
{/if}
