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
		placeHolder,
		onblur,
		autofocus = false
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
		onblur?: () => void;
		autofocus?: boolean;
	} = $props();

	async function handleAutofocus() {
		if (show && input && autofocus) {
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
		oninput={(e) => {
			value = e.currentTarget.value;
			handleFieldInput(value);
		}}
		onblur={() => onblur?.()}
		onkeydown={(e) => {
			if (e.key === 'Backspace' && value.trim() === '') {
				e.preventDefault();
				toggleField();
			}

			if (e.key === 'Enter' && value.trim() !== '') {
				e.preventDefault();
				handleCreate();
			}
		}}
		class="field-sizing-content outline-none placeholder:text-muted-foreground"
	/>
{/if}
