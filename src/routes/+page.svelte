<script lang="ts">
	import CommandInput from '$lib/components/global/CommandInput.svelte';
	import Container from '$lib/components/global/Container.svelte';
</script>

<Container>
	<div class="text-center">
		<h1 class="text-3xl font-bold">Welcome to HiNix</h1>
		<p class="text-muted-foreground">Let's track and manage your daily tasks</p>
	</div>
	<CommandInput />
</Container>
