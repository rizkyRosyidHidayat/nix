<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Button from '$lib/components/ui/button/button.svelte';
	import Kbd from '$lib/components/ui/kbd/kbd.svelte';
	import { Calendar, Clock, Repeat, Flag, FileText, Check, Plus } from '@lucide/svelte';
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

	// input refs
	let notesInput = $state<HTMLInputElement | null>(null);
	let dateTimeInput = $state<HTMLInputElement | null>(null);
	let deadlineInput = $state<HTMLInputElement | null>(null);
	let repeatInput = $state<HTMLInputElement | null>(null);
	let priorityInput = $state<HTMLInputElement | null>(null);

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

	let hasTitle = $derived(title.trim().length >= 3);

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
		const orderBeforeToggle: ('title' | FieldKey)[] = ['title', ...metadata.map((m) => m.field)];

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
						input: notesInput,
						prefix: PREFIXES.notes,
						placeHolder: 'add details or notes...'
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
						input: dateTimeInput,
						prefix: PREFIXES.dateTime,
						placeHolder: 'e.g. tomorrow 3pm'
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
						input: deadlineInput,
						prefix: PREFIXES.deadline,
						placeHolder: 'e.g. Friday 5pm'
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
						input: repeatInput,
						prefix: PREFIXES.repeat,
						placeHolder: 'e.g. day, weekday, weekend'
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
						input: priorityInput,
						prefix: PREFIXES.priority,
						placeHolder: 'e.g. high, medium, or low'
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
			await focusPreviousInput(field, orderBeforeToggle);
		}
	}

	async function focusPreviousInput(currentField: FieldKey, customOrder?: ('title' | FieldKey)[]) {
		const order: ('title' | FieldKey)[] = customOrder ?? ['title', ...metadata.map((m) => m.field)];
		const currentIndex = order.indexOf(currentField);

		for (let i = currentIndex - 1; i >= 0; i--) {
			const field = order[i];
			if (field === 'title') {
				titleInput?.focus();
				if (titleInput) {
					const len = titleInput.value.length;
					titleInput.setSelectionRange(len, len);
				}
				return;
			}
			await tick();
			const inputRef = getInputRef(field as FieldKey);
			if (inputRef) {
				inputRef.focus();
				const len = inputRef.value.length;
				inputRef.setSelectionRange(len, len);
				return;
			}
		}
	}

	function getInputRef(field: FieldKey): HTMLInputElement | null {
		return metadata.find((m) => m.field === field)?.input ?? null;
	}

	async function handleFieldInput(field: FieldKey, value: string) {
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
			<div class="mr-auto flex min-w-[80%] flex-wrap items-center gap-1 text-muted-foreground">
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
					placeholder="Add a new task..."
					class="text-foreground outline-none placeholder:text-muted-foreground {hasTitle
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
							{#if hasTitle}
								<Button size="icon-xs" variant="ghost" class="mt-0.5 text-foreground" {...props}>
									<Plus />
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
				<Kbd
					class="transition-opacity duration-200 ease-in {hasTitle ? 'opacity-100' : 'opacity-0'}"
					>Enter</Kbd
				>
				<Button size="sm" disabled={!hasTitle} onclick={handleCreate} class="rounded-full"
					>Save</Button
				>
			</div>
		</div>
	</Card.Content>
</Card.Root>
