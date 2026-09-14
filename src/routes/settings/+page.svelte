<script lang="ts">
	import Container from '$lib/components/global/Container.svelte';
	import SettingTheme from '$lib/features/settings/components/SettingTheme.svelte';
</script>

<svelte:head>
	<title>Settings | Nix</title>
	<meta name="description" content="Manage your preferences and customize your Nix experience." />
</svelte:head>

<Container>
	<h1 class="mb-2 text-center text-3xl font-bold">Settings</h1>
	<SettingTheme />
</Container>
