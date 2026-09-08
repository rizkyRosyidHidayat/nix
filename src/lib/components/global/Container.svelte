<script lang="ts">
	const { children } = $props();
</script>

<div
	class="mx-auto flex min-h-[calc(100vh-200px)] w-full max-w-2xl flex-col items-center justify-center gap-6 px-4"
>
	{@render children()}
</div>
