<script lang="ts">
	const { children, class: className = '' } = $props();
</script>

<div class="animate-in duration-500 fade-in slide-in-from-bottom-4">
	<div
		class="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 pb-6 {className}"
	>
		{@render children()}
	</div>
</div>
