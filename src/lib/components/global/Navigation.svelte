<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Home, Plus, ChevronRight, Settings, ListTodo } from '@lucide/svelte';
	import { fade, slide } from 'svelte/transition';
	import QuickAction from './QuickAction.svelte';
	import { todoState } from '$lib/features/todo';
	import Badge from '../ui/badge/badge.svelte';

	const upcomingTodos = $derived(todoState.upcomingTodos.data ?? []);

	const navItems = $derived([
		{
			icon: Home,
			onClick: () => goto(resolve('/')),
			domain: '/'
		},
		{
			icon: ListTodo,
			onClick: () => goto(resolve('/todo')),
			domain: '/todo',
			count: upcomingTodos.length
		},
		{
			icon: Settings,
			onClick: () => goto(resolve('/settings')),
			domain: '/settings'
		}
	]);

	const activatedDomain = $derived(
		navItems.find((item) => {
			if (item.domain === '/') return page.url.pathname === resolve('/');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return page.url.pathname.startsWith(resolve(item.domain as any));
		})?.domain || null
	);

	let isHovered = $state(false);

	let isHiddenItemSelected = $derived(
		!isHovered && navItems.slice(3).some((item) => item.domain === activatedDomain)
	);

	let showQuickAction = $state(false);
</script>

<!-- cover background layer -->
{#if showQuickAction}
	<div
		role="presentation"
		aria-hidden="true"
		class="fixed inset-0 z-10 bg-background/50 backdrop-blur-xs transition-all duration-200"
		transition:fade={{ duration: 200 }}
		onclick={() => (showQuickAction = false)}
	></div>
{/if}

<div class="sticky bottom-4 z-10 mx-auto flex w-full max-w-2xl justify-center gap-4 pt-4">
	<div
		role="navigation"
		aria-label="Main Navigation"
		class="flex rounded-3xl bg-card/70 ring-1 ring-background/80 backdrop-blur-md"
		onmouseenter={() => (isHovered = true)}
		onmouseleave={() => (isHovered = false)}
	>
		{#each navItems as { icon: Icon, onClick, domain, count }, idx (idx)}
			{#if isHovered || idx < 3}
				<button
					onclick={onClick}
					tabindex={idx}
					transition:slide={{ axis: 'x', duration: 200 }}
					class="relative flex size-12 cursor-pointer items-center justify-center transition-all duration-200 outline-none focus-visible:outline-none {activatedDomain ===
					domain
						? 'text-primary'
						: 'text-muted-foreground hover:text-primary'}"
				>
					{#if (count || 0) > 0 && activatedDomain !== domain}
						<Badge
							class="absolute top-1 right-1 h-4 min-w-4 rounded-full bg-destructive px-1 font-mono text-white tabular-nums "
							variant="destructive">{count}</Badge
						>
					{/if}
					<Icon size={20} />
				</button>
			{/if}
		{/each}
		{#if !isHovered && navItems.length > 3}
			<div transition:slide={{ axis: 'x', duration: 100 }} class="flex items-center">
				<div
					class="p-2 transition-all duration-100 {isHiddenItemSelected
						? 'text-primary'
						: 'text-muted-foreground'}"
				>
					<ChevronRight size={20} />
				</div>
			</div>
		{/if}
	</div>
	{#if showQuickAction}
		<div
			transition:slide={{ axis: 'y', duration: 200 }}
			class="absolute bottom-full left-1/2 mb-4 w-full -translate-x-1/2"
		>
			<QuickAction oncreate={() => (showQuickAction = false)} />
		</div>
	{/if}
	<button
		onclick={() => (showQuickAction = !showQuickAction)}
		class="flex size-12 cursor-pointer items-center justify-center rounded-3xl bg-primary text-primary-foreground transition-all duration-200 outline-none focus-visible:outline-none"
		aria-label="Add new todo"
	>
		<Plus size={20} class={showQuickAction ? 'rotate-45' : ''} />
	</button>
</div>
