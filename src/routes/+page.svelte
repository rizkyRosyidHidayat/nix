<script lang="ts">
	import QuickAction from '$lib/components/global/QuickAction.svelte';
	import Container from '$lib/components/global/Container.svelte';
	import { todoState } from '$lib/features/todo';
	import { globalState } from '$lib/stores/global.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	let isLoading = $derived(todoState.upcomingTodos.isLoading);
	let state = $derived(todoState.createMutation.state);

	$effect(() => {
		if (globalState.getIsFirstAddTodo()) {
			const timer = setTimeout(() => {
				globalState.setIsFirstAddTodo(false);
			}, 2000);
			return () => clearTimeout(timer);
		}
	});

	onMount(() => {
		clearCreatedState();
	});

	function clearCreatedState() {
		todoState.createMutation = {
			data: undefined,
			isLoading: false,
			state: 'pending',
			error: undefined
		};
	}

	function gotoPending() {
		goto(resolve('/todo'));
	}
</script>

{#if isLoading}
	<Container>
		<h1 class="text-center text-xl leading-relaxed text-muted-foreground">Loading your tasks...</h1>
	</Container>
{:else if state === 'success'}
	<Container>
		<h1 class="text-center text-3xl font-bold">You're all set! Let's get things done.</h1>
		<div class="flex items-center gap-4">
			<Button onclick={clearCreatedState} variant="outline">Add more todo</Button>
			<Button onclick={gotoPending}>See pending tasks</Button>
		</div>
	</Container>
{:else}
	<Container>
		<h1 class="mb-2 text-center text-3xl font-bold">What do you want to do?</h1>
		<QuickAction />
		<p class="text-center text-sm text-muted-foreground/70">
			Nix is your simple, local-first task manager.
		</p>
	</Container>
{/if}
