<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Button from '$lib/components/ui/button/button.svelte';
	import Kbd from '$lib/components/ui/kbd/kbd.svelte';
	import { ChevronDown, Calendar, Clock, Repeat, Flag, FileText, Check } from '@lucide/svelte';
	import { todoState } from '$lib/features/todo';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import MetadataInput from './MetadataInput.svelte';
	import { globalState } from '$lib/stores/global.svelte';

	let { oncreate }: { oncreate?: () => void } = $props();

	const PREFIXES = {
		notes: 'with note ',
		dateTime: 'at ',
		deadline: 'at deadline ',
		repeat: 'on every ',
		priority: 'on a priority '
	} as const;

	type FieldKey = keyof typeof PREFIXES;

	let isFocused = $state(false);

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

	$effect(() => {
		if (titleInput) {
			titleInput.focus();
		}
	});

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
					notesValue = '';
				} else {
					metadata.push({
						field: 'notes',
						value: notesValue,
						input: null,
						prefix: PREFIXES.notes,
						placeHolder: 'input notes'
					});
				}
				break;
			case 'dateTime':
				showDateTime = !isCurrentlyShown;
				if (!showDateTime) {
					metadata = metadata.filter((m) => m.field !== 'dateTime');
					dateTimeValue = '';
				} else {
					metadata.push({
						field: 'dateTime',
						value: dateTimeValue,
						input: null,
						prefix: PREFIXES.dateTime,
						placeHolder: 'ex: tomorrow 3pm'
					});
				}
				break;
			case 'deadline':
				showDeadline = !isCurrentlyShown;
				if (!showDeadline) {
					metadata = metadata.filter((m) => m.field !== 'deadline');
					deadlineValue = '';
				} else {
					metadata.push({
						field: 'deadline',
						value: deadlineValue,
						input: null,
						prefix: PREFIXES.deadline,
						placeHolder: 'ex: tomorrow 3pm'
					});
				}
				break;
			case 'repeat':
				showRepeat = !isCurrentlyShown;
				if (!showRepeat) {
					metadata = metadata.filter((m) => m.field !== 'repeat');
					repeatValue = '';
				} else {
					metadata.push({
						field: 'repeat',
						value: repeatValue,
						input: null,
						prefix: PREFIXES.repeat,
						placeHolder: 'day, weekday, or weekend'
					});
				}
				break;
			case 'priority':
				showPriority = !isCurrentlyShown;
				if (!showPriority) {
					metadata = metadata.filter((m) => m.field !== 'priority');
					priorityValue = '';
				} else {
					metadata.push({
						field: 'priority',
						value: priorityValue,
						input: null,
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
		return metadata.find((m) => m.field === field)?.input ?? null;
	}

	function handleFieldInput(field: FieldKey, value: string) {
		switch (field) {
			case 'notes':
				notesValue = value;
				break;
			case 'dateTime':
				dateTimeValue = value;
				break;
			case 'deadline':
				deadlineValue = value;
				break;
			case 'repeat':
				repeatValue = value;
				break;
			case 'priority':
				priorityValue = value;
				break;
		}

		const item = metadata.find((m) => m.field === field);
		if (item) {
			item.value = value;
		}

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

		// Ensure all metadata values are synced before creation
		for (const item of metadata) {
			switch (item.field) {
				case 'notes':
					notesValue = item.value;
					break;
				case 'dateTime':
					dateTimeValue = item.value;
					break;
				case 'deadline':
					deadlineValue = item.value;
					break;
				case 'repeat':
					repeatValue = item.value;
					break;
				case 'priority':
					priorityValue = item.value;
					break;
			}
		}

		const result = await todoState.createFromCommand({
			title: title.trim(),
			notes: showNotes ? notesValue.trim() || undefined : undefined,
			dateTime: showDateTime ? dateTimeValue.trim() || undefined : undefined,
			deadline: showDeadline ? deadlineValue.trim() || undefined : undefined,
			repeat: showRepeat ? repeatValue.trim() || undefined : undefined,
			priority: showPriority ? priorityValue.trim() || undefined : undefined
		});

		if (result.state === 'error' && result.error) {
			toast.error(result.error);
			return;
		}

		if (todoState.upcomingTodos.data.length === 1 || todoState.todos.data.length === 1) {
			globalState.setIsFirstAddTodo(true);
		}

		resetForm();
		oncreate?.();
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

<Card.Root
	class="w-full py-4 {isFocused
		? 'border-primary/40 shadow-md ring-2 ring-primary/20 dark:ring-primary/50'
		: 'backdrop-blur-sm'}"
>
	<Card.Content class="pr-4">
		<div class="flex flex-wrap items-center justify-end gap-4">
			<div class="mr-auto flex min-w-[80%] flex-wrap items-center gap-1">
				<input
					type="text"
					bind:this={titleInput}
					bind:value={title}
					onfocus={() => (isFocused = true)}
					onblur={() => (isFocused = false)}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							handleCreate();
						}
					}}
					placeholder="Add your todo here..."
					class="outline-none placeholder:text-muted-foreground {hasTitle
						? 'field-sizing-content'
						: 'w-full'}"
				/>

				{#each metadata as item (item.field)}
					<MetadataInput
						show={getShowState(item.field)}
						field={item.field}
						bind:value={item.value}
						bind:input={item.input}
						prefix={item.prefix}
						placeHolder={item.placeHolder}
						handleFieldInput={(value) => handleFieldInput(item.field, value)}
						{handleCreate}
						toggleField={() => toggleField(item.field)}
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
					<DropdownMenu.Content align="start" class="w-40">
						<DropdownMenu.Group>
							<DropdownMenu.Label class="text-xs font-semibold">Add Information</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item onclick={() => toggleField('notes')} class="gap-2 text-xs">
								<FileText size={13} class="text-muted-foreground" />
								<span class="flex-1">Notes</span>
								{#if showNotes}<Check size={13} class="text-primary" />{/if}
							</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => toggleField('dateTime')} class="gap-2 text-xs">
								<Calendar size={13} class="text-muted-foreground" />
								<span class="flex-1">Date/Time</span>
								{#if showDateTime}<Check size={13} class="text-primary" />{/if}
							</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => toggleField('deadline')} class="gap-2 text-xs">
								<Clock size={13} class="text-muted-foreground" />
								<span class="flex-1">Deadline</span>
								{#if showDeadline}<Check size={13} class="text-primary" />{/if}
							</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => toggleField('repeat')} class="gap-2 text-xs">
								<Repeat size={13} class="text-muted-foreground" />
								<span class="flex-1">Repeat todo</span>
								{#if showRepeat}<Check size={13} class="text-primary" />{/if}
							</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => toggleField('priority')} class="gap-2 text-xs">
								<Flag size={13} class="text-muted-foreground" />
								<span class="flex-1">Priority</span>
								{#if showPriority}<Check size={13} class="text-primary" />{/if}
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
			<div class="flex items-center gap-2">
				<Kbd>Enter</Kbd>
				<Button size="sm" disabled={!hasTitle} onclick={handleCreate}>Save</Button>
			</div>
		</div>
	</Card.Content>
</Card.Root>
