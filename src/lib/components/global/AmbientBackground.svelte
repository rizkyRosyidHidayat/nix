<script lang="ts">
	// Ambient glowing gradient background with subtle animation and dot-matrix mesh
</script>

<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none" aria-hidden="true">
	<!-- Base subtle tint -->
	<div
		class="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-10%,rgba(129,140,248,0.26),rgba(255,255,255,0)_70%)] transition-colors duration-500 dark:bg-[radial-gradient(ellipse_100%_70%_at_50%_-10%,rgba(99,102,241,0.36),rgba(15,15,22,0)_75%)]"
	></div>

	<!-- Moving ambient color orbs with dynamic hue-shifting and multi-directional orbits -->
	<div class="animate-color-shift absolute inset-0">
		<!-- Primary glowing orb (top-center / left) -->
		<div
			class="animate-orb-1 absolute top-[-15%] left-[10%] h-137.5 w-137.5 rounded-full bg-linear-to-br from-primary/45 via-indigo-400/35 to-transparent blur-[120px] dark:from-primary/50 dark:via-purple-600/40 dark:to-transparent"
		></div>

		<!-- Secondary sky/cyan orb (top-right) -->
		<div
			class="animate-orb-2 absolute top-[-10%] right-[5%] h-120 w-120 rounded-full bg-linear-to-bl from-sky-400/35 via-blue-500/25 to-transparent blur-[115px] dark:from-cyan-400/35 dark:via-indigo-500/30 dark:to-transparent"
		></div>

		<!-- Tertiary rose/fuchsia accent orb (center/bottom) -->
		<div
			class="animate-orb-3 absolute top-[35%] left-[25%] h-125 w-150 rounded-full bg-linear-to-tr from-pink-500/25 via-rose-400/20 to-transparent blur-[130px] dark:from-fuchsia-500/30 dark:via-pink-600/25 dark:to-transparent"
		></div>

		<!-- Bottom ambient glow -->
		<div
			class="animate-orb-4 absolute right-[20%] bottom-[-15%] h-100 w-125 rounded-full bg-linear-to-t from-indigo-400/25 via-purple-500/20 to-transparent blur-[120px] dark:from-indigo-500/30 dark:via-purple-800/25 dark:to-transparent"
		></div>
	</div>

	<!-- Refined micro-dot grid matrix with radial mask -->
	<div
		class="bg-size[24px_24px] absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] mask-[radial-gradient(ellipse_70%_60%_at_50%_35%,black_40%,transparent_100%)] opacity-[0.16] dark:opacity-[0.22]"
	></div>
</div>
