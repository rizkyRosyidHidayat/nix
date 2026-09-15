<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/global/Header.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import Navigation from '$lib/components/global/Navigation.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import SupportModal from '$lib/components/global/SupportModal.svelte';
	import TodoTimerModal from '$lib/features/todo/components/TodoTimerModal.svelte';
	import { todoTimerState } from '$lib/features/todo/todo.timer.svelte';
	import AmbientBackground from '$lib/components/global/AmbientBackground.svelte';

	let { children } = $props();

	$effect(() => {
		todoTimerState.start();
		return () => todoTimerState.stop();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher defaultMode="light" />
<Toaster position="top-center" duration={3000} />
<AmbientBackground />
<Header />
{@render children()}
<Navigation />
<SupportModal />
<TodoTimerModal />
