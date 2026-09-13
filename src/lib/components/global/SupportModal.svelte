<script lang="ts">
	import { globalState } from '$lib/stores/global.svelte';
	import { fade } from 'svelte/transition';
	import * as Card from '$lib/components/ui/card';
	import Kbd from '../ui/kbd/kbd.svelte';
	import Button from '../ui/button/button.svelte';
	import { Coffee, HeartHandshake, X } from '@lucide/svelte';
</script>

<svelte:window
	on:keydown={(e) => (e.key === 'Escape' ? globalState.setSupportModalIsOpen(false) : null)}
/>

{#if globalState.getSupportModalIsOpen()}
	<div
		role="presentation"
		aria-hidden="true"
		class="fixed inset-0 z-10 bg-background/50 backdrop-blur-xs transition-all duration-200"
		transition:fade={{ duration: 200 }}
		onclick={() => globalState.setSupportModalIsOpen(false)}
	></div>

	<div
		class="absolute top-1/2 left-1/2 z-10 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
		transition:fade={{ duration: 200 }}
	>
		<Card.Root class="mx-auto">
			<Card.Header class="flex flex-row items-center justify-between">
				<Card.Title class="flex-1 items-center">Support Us</Card.Title>
				<Kbd>Esc</Kbd>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => globalState.setSupportModalIsOpen(false)}
					aria-label="Close"
				>
					<X />
				</Button>
			</Card.Header>
			<Card.Content>
				<p class="mb-6 text-center text-muted-foreground">
					If you feel helpful and want to support us, please consider giving a star or a tip. Thanks
					for the support!
				</p>

				<div class="flex flex-col gap-3">
					<a
						href="https://ko-fi.com/M2Y525H15R"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center justify-center gap-2 rounded-2xl border bg-background px-4 py-3 transition-colors hover:border-destructive/50"
						onclick={close}
					>
						<Coffee size={18} class="text-destructive" />
						<span>Support Us</span>
					</a>
					<a
						href="https://github.com/rizkyRosyidHidayat/hinix"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center justify-center gap-2 rounded-2xl border bg-background px-4 py-3 transition-colors hover:border hover:border-primary"
						onclick={close}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
							/>
						</svg>
						<span>Star on GitHub</span>
					</a>
					<a
						href="https://x.com"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center justify-center gap-2 rounded-2xl border bg-background px-4 py-3 transition-colors hover:border hover:border-primary"
						onclick={close}
					>
						<svg
							xmlns="http://w3.org"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
							/>
						</svg>
						<span>Share on X</span>
					</a>
				</div>
			</Card.Content>
			<Card.Footer class="justify-center gap-2 text-xs text-muted-foreground">
				<span>Made with</span>
				<HeartHandshake size={14} class="text-destructive" />
				<span>for the community.</span>
			</Card.Footer>
		</Card.Root>
	</div>
{/if}
