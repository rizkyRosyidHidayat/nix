<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { CheckSquare, Home, Plus, ChevronRight, Settings } from '@lucide/svelte';
	import { slide } from 'svelte/transition';

	const navItems = [
		{
			icon: Home,
			onClick: () => goto(resolve('/')),
			domain: '/'
		},
		{
			icon: CheckSquare,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			onClick: () => goto(resolve('/todo' as any)),
			domain: '/todo'
		},
		{
			icon: Settings,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			onClick: () => goto(resolve('/settings' as any)),
			domain: '/settings'
		}
	];

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
</script>

<div class="sticky bottom-4 z-10 mx-auto flex w-full max-w-max gap-4">
	<div
		role="navigation"
		aria-label="Main Navigation"
		class="flex rounded-3xl border"
		onmouseenter={() => (isHovered = true)}
		onmouseleave={() => (isHovered = false)}
	>
		{#each navItems as { icon: Icon, onClick, domain }, idx (idx)}
			{#if isHovered || idx < 3}
				<button
					onclick={onClick}
					tabindex={idx}
					transition:slide={{ axis: 'x', duration: 200 }}
					class="flex size-10 cursor-pointer items-center justify-center transition-all duration-200 outline-none focus-visible:outline-none {activatedDomain ===
					domain
						? 'text-primary'
						: 'text-muted-foreground hover:text-primary'}"
				>
					<Icon size={16} />
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
					<ChevronRight size={16} />
				</div>
			</div>
		{/if}
	</div>
	<button
		class="focus-visible:outline-none} flex size-10 cursor-pointer items-center justify-center rounded-3xl bg-primary text-primary-foreground transition-all duration-200 outline-none"
	>
		<Plus size={16} />
	</button>
</div>
