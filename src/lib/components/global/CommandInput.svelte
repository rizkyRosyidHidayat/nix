<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ChevronDown } from '@lucide/svelte';
	import { todoService } from '$lib/features/todo';
	import { tick } from 'svelte';

	const PREFIXES = {
		notes: 'with note ',
		dateTime: 'at ',
		deadline: 'at deadline ',
		repeat: 'on every ',
		priority: 'on a priority '
	} as const;

	type FieldKey = keyof typeof PREFIXES;

	// Form values
	let title = $state('');
	let notesValue = $state('');
	let dateTimeValue = $state('');
	let deadlineValue = $state('');
	let repeatValue = $state('');
	let priorityValue = $state('');

	// Visibility toggles
	let showNotes = $state(false);
	let showDateTime = $state(false);
	let showDeadline = $state(false);
	let showRepeat = $state(false);
	let showPriority = $state(false);

	// Input element refs for focusing
	let notesInput = $state<HTMLInputElement | null>(null);
	let dateTimeInput = $state<HTMLInputElement | null>(null);
	let deadlineInput = $state<HTMLInputElement | null>(null);
	let repeatInput = $state<HTMLInputElement | null>(null);
	let priorityInput = $state<HTMLInputElement | null>(null);
	let titleInput = $state<HTMLInputElement | null>(null);

	let hasTitle = $derived(title.trim().length > 0);

	function getShowState(field: FieldKey): boolean {
		switch (field) {
			case 'notes':
				return showNotes;
			case 'dateTime':
				return showDateTime;
			case 'deadline':
				return showDeadline;
			case 'repeat':
				return showRepeat;
			case 'priority':
				return showPriority;
		}
	}

	async function toggleField(field: FieldKey) {
		const isCurrentlyShown = getShowState(field);

		switch (field) {
			case 'notes':
				showNotes = !isCurrentlyShown;
				break;
			case 'dateTime':
				showDateTime = !isCurrentlyShown;
				break;
			case 'deadline':
				showDeadline = !isCurrentlyShown;
				break;
			case 'repeat':
				showRepeat = !isCurrentlyShown;
				break;
			case 'priority':
				showPriority = !isCurrentlyShown;
				break;
		}

		// Focus the new input after DOM update
		if (!isCurrentlyShown) {
			await tick();
			const inputRef = getInputRef(field);
			if (inputRef) {
				inputRef.focus();
			}
		} else {
			focusPreviousInput(field);
		}
	}

	function focusPreviousInput(currentField: FieldKey) {
		const order: ('title' | FieldKey)[] = [
			'title',
			'notes',
			'dateTime',
			'deadline',
			'repeat',
			'priority'
		];
		const currentIndex = order.indexOf(currentField);

		for (let i = currentIndex - 1; i >= 0; i--) {
			const field = order[i];
			if (field === 'title') {
				titleInput?.focus();
				return;
			}
			if (getShowState(field as FieldKey)) {
				const inputRef = getInputRef(field as FieldKey);
				inputRef?.focus();
				return;
			}
		}
	}

	function getInputRef(field: FieldKey): HTMLInputElement | null {
		switch (field) {
			case 'notes':
				return notesInput;
			case 'dateTime':
				return dateTimeInput;
			case 'deadline':
				return deadlineInput;
			case 'repeat':
				return repeatInput;
			case 'priority':
				return priorityInput;
		}
	}

	function handleFieldInput(field: FieldKey, value: string) {
		if (value === '') {
			// User backspaced past prefix — auto-remove
			switch (field) {
				case 'notes':
					showNotes = false;
					notesValue = '';
					break;
				case 'dateTime':
					showDateTime = false;
					dateTimeValue = '';
					break;
				case 'deadline':
					showDeadline = false;
					deadlineValue = '';
					break;
				case 'repeat':
					showRepeat = false;
					repeatValue = '';
					break;
				case 'priority':
					showPriority = false;
					priorityValue = '';
					break;
			}
			focusPreviousInput(field);
		}
	}

	async function handleCreate() {
		if (!hasTitle) return;

		await todoService.createFromCommand({
			title: title.trim(),
			notes: showNotes ? notesValue.trim() || undefined : undefined,
			dateTime: showDateTime ? dateTimeValue.trim() || undefined : undefined,
			deadline: showDeadline ? deadlineValue.trim() || undefined : undefined,
			repeat: showRepeat ? repeatValue.trim() || undefined : undefined,
			priority: showPriority ? priorityValue.trim() || undefined : undefined
		});

		resetForm();
	}

	function resetForm() {
		title = '';
		notesValue = '';
		dateTimeValue = '';
		deadlineValue = '';
		repeatValue = '';
		priorityValue = '';
		showNotes = false;
		showDateTime = false;
		showDeadline = false;
		showRepeat = false;
		showPriority = false;
	}
</script>

<Card.Root class="w-full pt-3">
	<Card.Content>
		<div class="flex min-h-8 flex-wrap items-center gap-1">
			<input
				type="text"
				bind:this={titleInput}
				bind:value={title}
				placeholder="Create a task..."
				class="outline-none placeholder:text-muted-foreground {hasTitle
					? 'field-sizing-content'
					: 'w-full'}"
			/>

			{#if showNotes}
				<span>{PREFIXES.notes}</span>
				<input
					type="text"
					bind:this={notesInput}
					bind:value={notesValue}
					placeholder="input notes"
					oninput={() => handleFieldInput('notes', notesValue)}
					onkeydown={(e) => {
						if (e.key === 'Backspace' && notesValue.trim() === '') {
							e.preventDefault();
							toggleField('notes');
						}
					}}
					class="field-sizing-content outline-none placeholder:text-muted-foreground"
				/>
			{/if}

			{#if showDateTime}
				<span>{PREFIXES.dateTime}</span>
				<input
					type="text"
					bind:this={dateTimeInput}
					bind:value={dateTimeValue}
					placeholder="ex: tomorrow 3pm"
					oninput={() => handleFieldInput('dateTime', dateTimeValue)}
					onkeydown={(e) => {
						if (e.key === 'Backspace' && dateTimeValue.trim() === '') {
							e.preventDefault();
							toggleField('dateTime');
						}
					}}
					class="field-sizing-content outline-none placeholder:text-muted-foreground"
				/>
			{/if}

			{#if showDeadline}
				<span>{PREFIXES.deadline}</span>
				<input
					type="text"
					bind:this={deadlineInput}
					bind:value={deadlineValue}
					placeholder="ex: tomorrow 3pm"
					oninput={() => handleFieldInput('deadline', deadlineValue)}
					onkeydown={(e) => {
						if (e.key === 'Backspace' && deadlineValue.trim() === '') {
							e.preventDefault();
							toggleField('deadline');
						}
					}}
					class="field-sizing-content outline-none placeholder:text-muted-foreground"
				/>
			{/if}

			{#if showRepeat}
				<span>{PREFIXES.repeat}</span>
				<input
					type="text"
					bind:this={repeatInput}
					bind:value={repeatValue}
					placeholder="day, weekday, or weekend"
					oninput={() => handleFieldInput('repeat', repeatValue)}
					onkeydown={(e) => {
						if (e.key === 'Backspace' && repeatValue.trim() === '') {
							e.preventDefault();
							toggleField('repeat');
						}
					}}
					class="field-sizing-content outline-none placeholder:text-muted-foreground"
				/>
			{/if}

			{#if showPriority}
				<span>{PREFIXES.priority}</span>
				<input
					type="text"
					bind:this={priorityInput}
					bind:value={priorityValue}
					placeholder="low, medium, or high"
					oninput={() => handleFieldInput('priority', priorityValue)}
					onkeydown={(e) => {
						if (e.key === 'Backspace' && priorityValue.trim() === '') {
							e.preventDefault();
							toggleField('priority');
						}
					}}
					class="field-sizing-content outline-none placeholder:text-muted-foreground"
				/>
			{/if}

			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
					{#snippet child({ props }: any)}
						{#if hasTitle && title?.length >= 6}
							<Button size="icon-xs" variant="ghost" class="mt-0.5" {...props}>
								<ChevronDown />
							</Button>
						{/if}
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Group>
						<DropdownMenu.Label>Add Information</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={() => toggleField('notes')}>
							Notes {showNotes ? '✓' : ''}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => toggleField('dateTime')}>
							Date/Time {showDateTime ? '✓' : ''}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => toggleField('deadline')}>
							Deadline {showDeadline ? '✓' : ''}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => toggleField('repeat')}>
							Repeat task {showRepeat ? '✓' : ''}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => toggleField('priority')}>
							Priority {showPriority ? '✓' : ''}
						</DropdownMenu.Item>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</Card.Content>
	<Card.Footer class="gap-2">
		<Card.Action class="ml-auto">
			<Button size="xs" class="rounded-full" disabled={!hasTitle} onclick={handleCreate}>
				Save Task
			</Button>
		</Card.Action>
	</Card.Footer>
</Card.Root>
