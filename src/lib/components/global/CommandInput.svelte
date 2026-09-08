<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ChevronDown } from '@lucide/svelte';
	import { todoService } from '$lib/features/todo';
	import { tick } from 'svelte';
	import MetadataInput from './MetadataInput.svelte';

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

	let metadata = $state<
		{
			field: FieldKey;
			value: string;
			input: HTMLInputElement | null;
			prefix: string;
			placeHolder: string;
		}[]
	>([]);

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
				if (!showNotes) {
					metadata = metadata.filter((m) => m.field !== 'notes');
				} else {
					metadata.push({
						field: 'notes',
						value: notesValue,
						input: notesInput,
						prefix: PREFIXES.notes,
						placeHolder: 'input notes'
					});
				}
				break;
			case 'dateTime':
				showDateTime = !isCurrentlyShown;
				if (!showDateTime) {
					metadata = metadata.filter((m) => m.field !== 'dateTime');
				} else {
					metadata.push({
						field: 'dateTime',
						value: dateTimeValue,
						input: dateTimeInput,
						prefix: PREFIXES.dateTime,
						placeHolder: 'ex: tomorrow 3pm'
					});
				}
				break;
			case 'deadline':
				showDeadline = !isCurrentlyShown;
				if (!showDeadline) {
					metadata = metadata.filter((m) => m.field !== 'deadline');
				} else {
					metadata.push({
						field: 'deadline',
						value: deadlineValue,
						input: deadlineInput,
						prefix: PREFIXES.deadline,
						placeHolder: 'ex: tomorrow 3pm'
					});
				}
				break;
			case 'repeat':
				showRepeat = !isCurrentlyShown;
				if (!showRepeat) {
					metadata = metadata.filter((m) => m.field !== 'repeat');
				} else {
					metadata.push({
						field: 'repeat',
						value: repeatValue,
						input: repeatInput,
						prefix: PREFIXES.repeat,
						placeHolder: 'day, weekday, or weekend'
					});
				}
				break;
			case 'priority':
				showPriority = !isCurrentlyShown;
				if (!showPriority) {
					metadata = metadata.filter((m) => m.field !== 'priority');
				} else {
					metadata.push({
						field: 'priority',
						value: priorityValue,
						input: priorityInput,
						prefix: PREFIXES.priority,
						placeHolder: 'ex: high, medium, or low'
					});
				}
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
					metadata = metadata.filter((m) => m.field !== 'notes');
					break;
				case 'dateTime':
					showDateTime = false;
					dateTimeValue = '';
					metadata = metadata.filter((m) => m.field !== 'dateTime');
					break;
				case 'deadline':
					showDeadline = false;
					deadlineValue = '';
					metadata = metadata.filter((m) => m.field !== 'deadline');
					break;
				case 'repeat':
					showRepeat = false;
					repeatValue = '';
					metadata = metadata.filter((m) => m.field !== 'repeat');
					break;
				case 'priority':
					showPriority = false;
					priorityValue = '';
					metadata = metadata.filter((m) => m.field !== 'priority');
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
		metadata = [];
	}
</script>

<Card.Root class="w-full pt-3">
	<Card.Content>
		<div class="flex min-h-8 flex-wrap items-center gap-1">
			<input
				type="text"
				bind:this={titleInput}
				bind:value={title}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						handleCreate();
					}
				}}
				placeholder="Create a task..."
				class="outline-none placeholder:text-muted-foreground {hasTitle
					? 'field-sizing-content'
					: 'w-full'}"
			/>

			{#each metadata as { field, prefix, placeHolder }, i (field)}
				<MetadataInput
					show={getShowState(field)}
					{field}
					bind:value={metadata[i].value}
					bind:input={metadata[i].input}
					{prefix}
					{placeHolder}
					handleFieldInput={(value) => handleFieldInput(field, value)}
					{handleCreate}
					toggleField={() => toggleField(field)}
				/>
			{/each}

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
			<Button size="sm" disabled={!hasTitle} onclick={handleCreate}>Save Task</Button>
		</Card.Action>
	</Card.Footer>
</Card.Root>
