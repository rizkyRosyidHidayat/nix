<script lang="ts">
	import { todoState } from '$lib/features/todo';
	import * as Card from '$lib/components/ui/card';
	import { Search, X } from '@lucide/svelte';
	import TodoItem from './TodoItem.svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Kbd } from '$lib/components/ui/kbd';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	let isSelected = $state(false);
	let inputValue = $state('');
	let search = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);
	let expandedItems = $state<Record<string, boolean>>({});

	let todos = $derived(todoState.todos.data);

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	function handleInput(val: string) {
		inputValue = val;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			search = val.trim();
		}, 150);
	}

	let query = $derived(search.toLowerCase());
	let isSearching = $derived(query.length >= 1);

	let filteredTodos = $derived.by(() => {
		if (!isSearching) return [];
		return todos.filter((todo) => {
			const inTitle = todo.title.toLowerCase().includes(query);
			const inNotes = todo.notes ? todo.notes.toLowerCase().includes(query) : false;
			const inPriority = todo.priority ? todo.priority.toLowerCase().includes(query) : false;
			return inTitle || inNotes || inPriority;
		});
	});

	function handleFocus() {
		isSelected = true;
	}

	function onClose() {
		isSelected = false;
	}

	function handleClear() {
		inputValue = '';
		search = '';
		if (isSelected) {
			inputRef?.focus();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			inputRef?.blur();
			onClose();
		}
	}
</script>

<!-- Backdrop overlay when search is active -->
{#if isSelected}
	<div
		role="presentation"
		aria-hidden="true"
		class="fixed inset-0 z-40 bg-background/60 backdrop-blur-xs transition-all duration-300"
		transition:fade={{ duration: 200 }}
		onclick={onClose}
	></div>
{/if}

<div
	class="relative w-full max-w-md transition-all duration-300 ease-out {isSelected
		? 'z-50'
		: 'z-10'}"
>
	<!-- Search Input Card -->
	<Card.Root
		class="w-full py-4 transition-all duration-300 ease-out {isSelected
			? 'border-primary/40 shadow-md ring-2 ring-primary/20 dark:ring-primary/50'
			: 'backdrop-blur-sm'}"
	>
		<Card.Content class="flex items-center gap-3 px-4 py-0">
			<Search
				size={18}
				class="shrink-0 transition-colors duration-200 {isSelected
					? 'text-primary/70'
					: 'text-muted-foreground/70'}"
			/>
			<input
				bind:this={inputRef}
				type="text"
				placeholder="Search tasks by title, note, or priority..."
				class="w-full bg-transparent text-sm font-medium tracking-tight text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
				onfocus={handleFocus}
				onkeydown={handleKeyDown}
				value={inputValue}
				oninput={(e) => handleInput(e.currentTarget.value)}
			/>

			{#if inputValue.length > 0}
				<button
					type="button"
					onclick={handleClear}
					aria-label="Clear search"
					class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-150 hover:bg-muted-foreground/20 hover:text-foreground"
				>
					<X size={12} />
				</button>
			{/if}

			{#if isSelected}
				<Kbd>ESC</Kbd>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Search Results Dropdown -->
	{#if isSelected && isSearching}
		<div
			in:fly={{ y: 8, duration: 200, easing: cubicOut }}
			out:fade={{ duration: 150 }}
			class="absolute top-full mt-2 flex w-full flex-col gap-2 rounded-2xl border border-border/70 bg-card p-3 shadow-md backdrop-blur-md"
		>
			<!-- Results Header -->
			<div class="flex items-center justify-between px-1 pb-1 text-sm text-muted-foreground">
				<span>
					{filteredTodos.length === 1 ? '1 task found' : `${filteredTodos.length} tasks found`}
				</span>
			</div>

			<!-- Results List -->
			{#if filteredTodos.length > 0}
				<ScrollArea class="max-h-[40vh]">
					{#each filteredTodos as todo (todo.id)}
						<div class="mb-2 w-full last:mb-0">
							<TodoItem
								class="shadow-none ring-0"
								{todo}
								bind:isExpanded={expandedItems[todo.id]}
							/>
						</div>
					{/each}
				</ScrollArea>
			{:else}
				<div
					class="flex flex-col items-center justify-center gap-1.5 py-6 text-center text-muted-foreground"
				>
					<p class="text-sm font-medium text-foreground">No tasks found matching "{search}"</p>
					<p class="text-sm text-muted-foreground">Try searching with different keywords</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
