<script lang="ts">
	import Container from '$lib/components/global/Container.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { todoState } from '$lib/features/todo';
	import TodoDate from '$lib/features/todo/components/TodoDate.svelte';
	import TodoStackedList from '$lib/features/todo/components/TodoStackedList.svelte';
	import { ListTodo, List } from '@lucide/svelte';

	type TabMode = 'all' | 'pending';
	let tab = $state<TabMode>('pending');

	let todos = $derived(todoState.upcomingTodos.data);
	let isLoading = $derived(todoState.upcomingTodos.isLoading);
	let groupedTodos = $derived(todoState.upcomingTodosGrouped.data);

	const tabs = $derived([
		{
			label: 'Pending Task',
			value: 'pending',
			icon: List
		},
		{
			label: 'All Tasks',
			value: 'all',
			icon: ListTodo
		}
	] as const);

	function handleSetTab(value: TabMode) {
		tab = value;
	}

	$effect(() => {
		if (!isLoading && !todos.length) {
			handleSetTab('all');
		}
	});
</script>

<svelte:head>
	<title>Explore All Tasks | Nix</title>
	<meta
		name="description"
		content="Explore and organize all your tasks by date with an interactive weekly calendar."
	/>
</svelte:head>

<Container>
	<!-- Page Header -->
	<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Explore all your tasks</h1>
	{#if !isLoading}
		<div class="flex items-center gap-0.5 rounded-full bg-card/50 p-0.5 ring-1 ring-background/60">
			{#each tabs as option (option.value)}
				{@const isActive = tab === option.value}
				<Button
					variant={isActive ? 'default' : 'ghost'}
					size="sm"
					class="gap-1.5 rounded-full px-3 text-xs font-normal transition-all duration-200 {isActive
						? 'shadow-sm'
						: 'hover:bg-muted'}"
					onclick={() => handleSetTab(option.value)}
				>
					<option.icon size={13} class={isActive ? '' : 'text-muted-foreground'} />
					{option.label}
				</Button>
			{/each}
		</div>
	{/if}

	{#if isLoading}
		<p class="py-12 text-center text-muted-foreground">Loading todos...</p>
	{:else if tab === 'pending'}
		<TodoStackedList {todos} {groupedTodos} />
	{:else if tab === 'all'}
		<TodoDate />
	{/if}
</Container>
