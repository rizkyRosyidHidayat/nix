<script lang="ts">
	import Container from '$lib/components/global/Container.svelte';
	import TodoSearch from '$lib/features/todo/components/TodoSearch.svelte';
	import TodoDate from '$lib/features/todo/components/TodoDate.svelte';
</script>

<svelte:head>
	<title>Discover All Todos | Nix</title>
	<meta
		name="description"
		content="Explore and organize all your todos by date with an interactive weekly calendar."
	/>
</svelte:head>

<Container>
	<!-- Page Header -->
	<h1 class="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">Discover all your todos</h1>

	<TodoSearch />

	<TodoDate />
</Container>
