<script>
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/button/button.svelte';
	import { globalState } from '$lib/stores/global.svelte';
</script>

<header class="relative top-0 mb-6 w-full px-4 py-2 md:sticky md:mb-0 md:px-6 md:py-4">
	<div class="flex items-center justify-between">
		<a href={resolve('/')} class="text-xl font-semibold text-primary">Nix</a>
		<Button size="sm" class="rounded-full" onclick={() => globalState.setSupportModalIsOpen(true)}
			>Support Us</Button
		>
	</div>
</header>
