<script lang="ts">
	import { tick } from 'svelte';

	let {
		show,
		field,
		value = $bindable(),
		input = $bindable(),
		prefix,
		handleFieldInput,
		handleCreate,
		toggleField,
		placeHolder
	}: {
		show: boolean;
		field: string;
		value: string;
		input: HTMLInputElement | null;
		prefix: string;
		placeHolder: string;
		handleFieldInput: (value: string) => void;
		handleCreate: () => void;
		toggleField: () => void;
	} = $props();

	async function handleAutofocus() {
		if (show && input) {
			await tick();
			input.focus();
		}
	}

	$effect(() => {
		handleAutofocus();
	});
</script>

{#if show}
	<span>{prefix}</span>
	<input
		type="text"
		name={field}
		bind:this={input}
		bind:value
		placeholder={placeHolder}
		oninput={() => handleFieldInput(value)}
		onkeydown={(e) => {
			if (e.key === 'Backspace' && value.trim() === '') {
				e.preventDefault();
				toggleField();
			}

			if (e.key === 'Enter' && value.trim() !== '') {
				handleCreate();
			}
		}}
		class="field-sizing-content outline-none placeholder:text-muted-foreground"
	/>
{/if}
