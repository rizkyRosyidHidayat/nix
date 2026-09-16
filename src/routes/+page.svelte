<script lang="ts">
	import QuickAction from '$lib/components/global/QuickAction.svelte';
	import Container from '$lib/components/global/Container.svelte';
	import { todoState } from '$lib/features/todo';
	import { globalState } from '$lib/stores/global.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, untrack } from 'svelte';

	let isLoading = $derived(todoState.upcomingTodos.isLoading);
	let mutationState = $derived(todoState.createMutation.state);
	let countdown = $state(10);

	$effect(() => {
		if (mutationState === 'success') {
			untrack(() => {
				countdown = 10;
			});
			const timer = setInterval(() => {
				if (countdown > 1) {
					countdown -= 1;
				} else {
					clearInterval(timer);
					gotoPending();
				}
			}, 1000);

			return () => clearInterval(timer);
		}
	});

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
{:else if mutationState === 'success'}
	<Container>
		<h1 class="text-center text-3xl font-bold">You're all set! Let's get things done.</h1>
		<p class="text-center text-sm text-muted-foreground">
			Redirecting to pending tasks in <span class="font-medium text-foreground">{countdown}s</span>
			<button
				type="button"
				onclick={gotoPending}
				class="ml-1 cursor-pointer font-medium text-primary underline underline-offset-4 hover:text-primary/80"
			>
				Go now
			</button>
		</p>
		<div class="flex w-full items-center justify-center gap-1">
			<hr class="inline-block h-px w-18 border-muted-foreground/30" />
			<span class="text-sm text-muted-foreground">or</span>
			<hr class="inline-block h-px w-18 border-muted-foreground/30" />
		</div>
		<Button
			variant="outline"
			size="sm"
			onclick={clearCreatedState}
			class="rounded-full border-card/60 bg-card/50 text-xs text-muted-foreground"
		>
			Back to home
		</Button>
	</Container>
{:else}
	<Container>
		<h1 class="mb-2 text-center text-3xl font-bold">What do you want to do?</h1>
		<QuickAction />
		<p class="text-center text-sm text-muted-foreground">
			Nix is your simple, local-first task manager.
		</p>
	</Container>
{/if}
