<script>
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/button/button.svelte';
	import { globalState } from '$lib/stores/global.svelte';
</script>

<header class="sticky top-0 w-full px-4 py-2 md:px-6 md:py-4">
	<div class="flex items-center justify-between">
		<a href={resolve('/')} class="text-xl font-semibold text-primary">Nix</a>
		<Button size="sm" onclick={() => globalState.setSupportModalIsOpen(true)}>Support Us</Button>
	</div>
</header>
