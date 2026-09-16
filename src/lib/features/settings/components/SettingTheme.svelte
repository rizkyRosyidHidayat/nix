<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Sun, Moon } from '@lucide/svelte';
	import { mode, setMode } from 'mode-watcher';
	import { SettingTheme } from '../settings.type';

	const themeOptions = [
		{ value: SettingTheme.Light, label: 'Light', icon: Sun },
		{ value: SettingTheme.Dark, label: 'Dark', icon: Moon }
	] as const;

	function handleSetTheme(theme: SettingTheme) {
		setMode(theme);
	}

	let currentMode = $derived(mode.current);
</script>

<Card.Root class="w-full py-4">
	<Card.Header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex flex-col gap-1">
			<Card.Title class="text-base">Application Theme</Card.Title>
			<p class="text-sm text-muted-foreground">
				Choose how the app looks. Current: <span class="font-medium text-foreground capitalize"
					>{currentMode}</span
				>
			</p>
		</div>
		<div class="flex w-full items-center gap-0.5 rounded-full border bg-card p-0.5 sm:w-auto">
			{#each themeOptions as option (option.value)}
				{@const isActive = currentMode === option.value}
				<Button
					variant={isActive ? 'default' : 'ghost'}
					size="sm"
					class="flex-1 gap-1.5 rounded-full px-3 text-xs font-normal transition-all duration-200 sm:flex-none {isActive
						? 'shadow-sm'
						: 'hover:bg-muted'}"
					onclick={() => handleSetTheme(option.value)}
				>
					<option.icon size={13} class={isActive ? '' : 'text-muted-foreground'} />
					{option.label}
				</Button>
			{/each}
		</div>
	</Card.Header>
</Card.Root>
