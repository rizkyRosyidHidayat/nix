<script lang="ts">
	import type { Todo } from '../todo.type';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import {
		CheckCircle2,
		Circle,
		Trash2,
		ChevronDown,
		Calendar,
		Clock,
		Repeat,
		Flag,
		FileText,
		Plus,
		Check,
		X
	} from '@lucide/svelte';
	import { todoState } from '$lib/features/todo';
	import MetadataInput from '$lib/components/global/MetadataInput.svelte';
	import { tick, untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { clickOutside } from '$lib/utils';

	let { todo, isExpanded = $bindable() }: { todo: Todo; isExpanded?: boolean } = $props();

	const PREFIXES = {
		notes: 'with note ',
		dateTime: 'at ',
		deadline: 'at deadline ',
		repeat: 'on every ',
		priority: 'on a priority '
	} as const;

	type FieldKey = keyof typeof PREFIXES;

	function formatDateTime(date?: string, time?: string): string {
		if (!date) return '';
		return time ? `${date} ${time}` : date;
	}

	type MetadataItem = {
		field: FieldKey;
		value: string;
		input: HTMLInputElement | null;
		prefix: string;
		placeHolder: string;
	};

	function buildInitialMetadata(item: Todo): MetadataItem[] {
		const list: MetadataItem[] = [];
		if (item.notes) {
			list.push({
				field: 'notes',
				value: item.notes,
				input: null,
				prefix: PREFIXES.notes,
				placeHolder: 'input notes'
			});
		}
		if (item.startDate || item.startTime) {
			list.push({
				field: 'dateTime',
				value: formatDateTime(item.startDate, item.startTime),
				input: null,
				prefix: PREFIXES.dateTime,
				placeHolder: 'ex: tomorrow 3pm'
			});
		}
		if (item.dueDate || item.endTime) {
			list.push({
				field: 'deadline',
				value: formatDateTime(item.dueDate, item.endTime),
				input: null,
				prefix: PREFIXES.deadline,
				placeHolder: 'ex: tomorrow 3pm'
			});
		}
		if (item.interval) {
			list.push({
				field: 'repeat',
				value: item.interval,
				input: null,
				prefix: PREFIXES.repeat,
				placeHolder: 'day, weekday, or weekend'
			});
		}
		if (item.priority) {
			list.push({
				field: 'priority',
				value: item.priority,
				input: null,
				prefix: PREFIXES.priority,
				placeHolder: 'ex: high, medium, or low'
			});
		}
		return list;
	}

	// Card interaction state
	let isSaving = $state(false);
	let isEditingTitle = $state(false);

	// Form draft values
	let title = $state(untrack(() => todo.title));
	let titleInput = $state<HTMLInputElement | null>(null);
	let metadata = $state<MetadataItem[]>(untrack(() => buildInitialMetadata(todo)));

	// Synchronize state when the todo prop updates externally (e.g. from database/store updates)
	let lastUpdatedAt = $state(untrack(() => todo.updatedAt));
	let lastTodoId = $state(untrack(() => todo.id));

	$effect(() => {
		// If the todo ID changed or external updatedAt changed while not actively editing, sync
		if (
			todo.id !== lastTodoId ||
			(!isEditingTitle && !isSaving && todo.updatedAt !== lastUpdatedAt)
		) {
			lastTodoId = todo.id;
			lastUpdatedAt = todo.updatedAt;
			title = todo.title;
			metadata = buildInitialMetadata(todo);
		}
	});

	function getShowState(field: FieldKey): boolean {
		return metadata.some((m) => m.field === field);
	}

	function getInputRef(field: FieldKey): HTMLInputElement | null {
		return metadata.find((m) => m.field === field)?.input ?? null;
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

	async function toggleField(field: FieldKey) {
		const isCurrentlyShown = getShowState(field);

		if (isCurrentlyShown) {
			metadata = metadata.filter((m) => m.field !== field);
			await handleSave();
			focusPreviousInput(field);
		} else {
			let placeHolder = '';
			switch (field) {
				case 'notes':
					placeHolder = 'input notes';
					break;
				case 'dateTime':
					placeHolder = 'ex: tomorrow 3pm';
					break;
				case 'deadline':
					placeHolder = 'ex: tomorrow 3pm';
					break;
				case 'repeat':
					placeHolder = 'day, weekday, or weekend';
					break;
				case 'priority':
					placeHolder = 'ex: high, medium, or low';
					break;
			}
			metadata.push({
				field,
				value: '',
				input: null,
				prefix: PREFIXES[field],
				placeHolder
			});
			isExpanded = true;
			await tick();
			const inputRef = getInputRef(field);
			if (inputRef) {
				inputRef.focus();
			}
		}
	}

	function handleFieldInput(field: FieldKey, value: string) {
		const item = metadata.find((m) => m.field === field);
		if (item) {
			item.value = value;
		}

		if (value === '') {
			metadata = metadata.filter((m) => m.field !== field);
			handleSave();
			focusPreviousInput(field);
		}
	}

	async function handleSave() {
		if (!title.trim()) {
			title = todo.title; // restore if left empty
			return;
		}

		const getVal = (field: FieldKey) => {
			const item = metadata.find((m) => m.field === field);
			return item ? item.value.trim() || undefined : undefined;
		};

		isSaving = true;
		try {
			const result = await todoState.updateFromCommand(todo.id, {
				title: title.trim(),
				notes: getVal('notes'),
				dateTime: getVal('dateTime'),
				deadline: getVal('deadline'),
				repeat: getVal('repeat'),
				priority: getVal('priority')
			});

			if (result.state === 'error' && result.error) {
				toast.error(result.error);
			} else if (result.data) {
				lastUpdatedAt = result.data.updatedAt;
			}
		} finally {
			isSaving = false;
		}
	}

	function handleCheck(e?: MouseEvent) {
		e?.stopPropagation();
		if (!todo.isCompleted) {
			todoState.complete(todo.id);
		} else {
			todoState.incomplete(todo.id);
		}
	}

	function handleDelete(e?: MouseEvent) {
		e?.stopPropagation();
		todoState.delete(todo.id);
	}

	async function handleCardClick(e: MouseEvent) {
		const target = e.target as HTMLElement | null;
		// Don't toggle if user clicked on button, dropdown, input, or interactive controls
		if (
			target?.closest('button') ||
			target?.closest('input') ||
			target?.closest('[data-dropdown-menu-content]') ||
			target?.closest('[role="menuitem"]')
		) {
			return;
		}

		isExpanded = true;
		await tick();
		titleInput?.focus();
	}

	async function toggleExpand(e?: MouseEvent) {
		e?.stopPropagation();
		isExpanded = !isExpanded;
		if (isExpanded) {
			await tick();
			titleInput?.focus();
		} else {
			await handleSave();
		}
	}

	// Priority badge formatting
	const priorityBadgeColors: Record<string, string> = {
		high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
		medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
		low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
	};
</script>

<div
	role="region"
	aria-label="Todo item"
	class="group/item relative w-full transition-all duration-200"
	use:clickOutside={() => (isExpanded = false)}
>
	<Card.Root
		class="relative overflow-hidden border transition-all duration-200
		{isExpanded
			? 'gap-3 border-primary/40 py-3.5 shadow-none ring-2 ring-primary/25'
			: 'cursor-pointer gap-0 py-3'}"
		onclick={handleCardClick}
	>
		<!-- Header / Main row -->
		<div class="flex items-center gap-3 px-4">
			<!-- Checkbox with smooth micro-animation -->
			<button
				type="button"
				onclick={handleCheck}
				aria-label={todo.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
				class="shrink-0 rounded-full p-0.5 text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
			>
				{#if todo.isCompleted}
					<CheckCircle2
						class="scale-100 text-emerald-600 transition-transform duration-200 dark:text-emerald-400"
						size={20}
					/>
				{:else}
					<Circle class="text-muted-foreground/60 transition-colors hover:text-primary" size={20} />
				{/if}
			</button>

			<!-- Title & Collapsed preview badges -->
			<div class="flex min-w-0 flex-1 flex-col gap-1.5">
				<input
					type="text"
					bind:this={titleInput}
					bind:value={title}
					onfocus={() => {
						isEditingTitle = true;
						if (!isExpanded) isExpanded = true;
					}}
					onblur={() => {
						isEditingTitle = false;
						handleSave();
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.currentTarget.blur();
							handleSave();
						}
					}}
					placeholder="Todo title..."
					class="w-full bg-transparent text-sm font-medium transition-colors outline-none {todo.isCompleted
						? 'text-muted-foreground line-through'
						: 'text-foreground'}"
				/>

				<!-- Collapsed preview pills (shown when collapsed and metadata exists) -->
				{#if !isExpanded && (todo.priority || todo.dueDate || todo.endTime || todo.startDate || todo.startTime || todo.interval || todo.notes)}
					<div class="flex flex-wrap items-center gap-1.5 pt-0.5">
						{#if todo.priority}
							<span
								class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium tracking-wider uppercase {priorityBadgeColors[
									todo.priority.toLowerCase()
								] ?? 'bg-muted text-muted-foreground'}"
							>
								<Flag size={10} />
								{todo.priority}
							</span>
						{/if}

						{#if todo.startDate || todo.startTime}
							<span
								class="inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground"
							>
								<Calendar size={11} />
								{formatDateTime(todo.startDate, todo.startTime)}
							</span>
						{/if}

						{#if todo.dueDate || todo.endTime}
							<span
								class="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-700 dark:text-amber-400"
							>
								<Clock size={11} />
								{formatDateTime(todo.dueDate, todo.endTime)}
							</span>
						{/if}

						{#if todo.interval}
							<span
								class="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary"
							>
								<Repeat size={11} />
								{todo.interval}
							</span>
						{/if}

						{#if todo.notes}
							<span
								class="inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground"
								title={todo.notes}
							>
								<FileText size={11} />
								note
							</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Right quick actions -->
			<div class="flex items-center gap-1">
				<Button
					size="icon-sm"
					variant="ghost"
					onclick={handleDelete}
					title="Delete todo"
					class="shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover/item:opacity-100 hover:bg-destructive/10 hover:text-destructive"
				>
					<Trash2 size={16} />
				</Button>

				<Button
					size="icon-sm"
					variant="ghost"
					onclick={toggleExpand}
					title={isExpanded ? 'Collapse' : 'Expand details'}
					class="shrink-0 text-muted-foreground transition-transform duration-200 hover:text-foreground"
				>
					<ChevronDown
						size={16}
						class="transition-transform duration-200 {isExpanded ? 'rotate-180 text-primary' : ''}"
					/>
				</Button>
			</div>
		</div>

		<!-- Expanded Content Section -->
		{#if isExpanded}
			<div class="flex animate-in flex-col gap-3 px-4 pt-2 duration-150 fade-in-50">
				<!-- Metadata items editor -->
				<div class="flex flex-col gap-2">
					{#if metadata.length > 0}
						<div class="flex flex-wrap items-center gap-1.5">
							{#each metadata as item (item.field)}
								<div
									class="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/70 px-2 py-1 text-xs text-muted-foreground transition-all hover:border-border"
								>
									{#if item.field === 'notes'}
										<FileText size={12} class="shrink-0 text-primary/70" />
									{:else if item.field === 'dateTime'}
										<Calendar size={12} class="shrink-0 text-blue-500/80" />
									{:else if item.field === 'deadline'}
										<Clock size={12} class="shrink-0 text-amber-500/80" />
									{:else if item.field === 'repeat'}
										<Repeat size={12} class="shrink-0 text-emerald-500/80" />
									{:else if item.field === 'priority'}
										<Flag size={12} class="shrink-0 text-rose-500/80" />
									{/if}

									<MetadataInput
										show={getShowState(item.field)}
										field={item.field}
										bind:value={item.value}
										bind:input={item.input}
										prefix={item.prefix}
										placeHolder={item.placeHolder}
										handleFieldInput={(value) => handleFieldInput(item.field, value)}
										handleCreate={handleSave}
										toggleField={() => toggleField(item.field)}
										onblur={handleSave}
									/>

									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											toggleField(item.field);
										}}
										class="ml-0.5 rounded-xs p-0.5 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
										title="Remove"
									>
										<X size={11} />
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-xs text-muted-foreground/70 italic">
							No extra details yet. Click "Add Info" below to set due dates, notes, or priority.
						</p>
					{/if}
				</div>

				<!-- Card Action Footer -->
				<div class="flex items-center justify-between gap-2 pt-1">
					<!-- Add Info Dropdown -->
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
							{#snippet child({ props }: any)}
								<Button
									size="xs"
									variant="outline"
									class="h-7 gap-1 rounded-full text-xs"
									{...props}
								>
									<Plus size={12} />
									<span>Add Info</span>
									<ChevronDown size={12} class="opacity-60" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="start" class="w-40">
							<DropdownMenu.Group>
								<DropdownMenu.Label class="text-xs font-semibold">Information</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.Item onclick={() => toggleField('notes')} class="gap-2 text-xs">
									<FileText size={13} class="text-muted-foreground" />
									<span class="flex-1">Notes</span>
									{#if getShowState('notes')}<Check size={13} class="text-primary" />{/if}
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => toggleField('dateTime')} class="gap-2 text-xs">
									<Calendar size={13} class="text-muted-foreground" />
									<span class="flex-1">Date/Time</span>
									{#if getShowState('dateTime')}<Check size={13} class="text-primary" />{/if}
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => toggleField('deadline')} class="gap-2 text-xs">
									<Clock size={13} class="text-muted-foreground" />
									<span class="flex-1">Deadline</span>
									{#if getShowState('deadline')}<Check size={13} class="text-primary" />{/if}
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => toggleField('repeat')} class="gap-2 text-xs">
									<Repeat size={13} class="text-muted-foreground" />
									<span class="flex-1">Repeat todo</span>
									{#if getShowState('repeat')}<Check size={13} class="text-primary" />{/if}
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => toggleField('priority')} class="gap-2 text-xs">
									<Flag size={13} class="text-muted-foreground" />
									<span class="flex-1">Priority</span>
									{#if getShowState('priority')}<Check size={13} class="text-primary" />{/if}
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>

					<!-- Action Buttons -->
					<div class="flex items-center gap-1.5">
						<Button
							size="xs"
							variant={todo.isCompleted ? 'secondary' : 'default'}
							class="h-7 gap-1 rounded-full text-xs transition-all"
							onclick={handleCheck}
						>
							{#if todo.isCompleted}
								<Check size={12} class="text-emerald-500" />
								<span>Completed</span>
							{:else}
								<span>Mark as completed</span>
							{/if}
						</Button>

						<Button size="xs" variant="outline" class="h-7 rounded-full" onclick={toggleExpand}>
							Done
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</Card.Root>
</div>
