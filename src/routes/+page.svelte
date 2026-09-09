<script lang="ts">
	import QuickAction from '$lib/components/global/QuickAction.svelte';
	import Container from '$lib/components/global/Container.svelte';
	import { todoState } from '$lib/features/todo';
	import { globalState } from '$lib/stores/global.svelte';
	import TodoItem from '$lib/features/todo/components/TodoItem.svelte';

	let pendingToday = $derived(
		todoState
			.getTodos()
			.filter((todo) => todo.createdAt.split('T')[0] === new Date().toISOString().split('T')[0])
	);

	$effect(() => {
		todoState.list();

		if (globalState.getIsFirstAddTodo()) {
			setTimeout(() => {
				globalState.setIsFirstAddTodo(false);
			}, 3000);
		}
	});
</script>

{#if todoState.getIsLoading()}
	<Container>
		<h1 class="text-center text-xl leading-relaxed text-muted-foreground">Loading...</h1>
	</Container>
{:else if todoState.getTodos().length === 0}
	<Container>
		<h1 class="mb-4 text-center text-3xl font-bold">Hello, let's add your first todo</h1>
		<QuickAction />
		<p class="text-center text-xs text-muted-foreground">Nix is an application for managing todo</p>
	</Container>
{:else if todoState.getTodos().length === 1 && globalState.getIsFirstAddTodo()}
	<Container>
		<h1 class="text-center text-3xl font-bold">Great, start the journey now</h1>
	</Container>
{:else}
	<Container>
		<h1 class="mb-4 text-center text-3xl font-bold">You are on your way. Let's keep it up!</h1>
		<div class="flex w-full max-w-md flex-col gap-2">
			{#each pendingToday as todo (todo.id)}
				<TodoItem {todo} />
			{/each}
		</div>
	</Container>
{/if}
