<script lang="ts">
	import type { Todo } from '../todo.type';
	import * as Card from '$lib/components/ui/card';
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
		Check
	} from '@lucide/svelte';
	import { todoState } from '$lib/features/todo';
	import MetadataInput from '$lib/components/global/MetadataInput.svelte';
	import { tick, untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { clickOutside } from '$lib/utils';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	let {
		todo,
		isExpanded = $bindable(),
		class: className
	}: { todo: Todo; isExpanded?: boolean; class?: string } = $props();

	const PREFIXES = {
		notes: 'Notes:',
		dateTime: 'Date/Time:',
		deadline: 'Deadline:',
		repeat: 'Repeat:',
		priority: 'Priority:'
	} as const;

	type FieldKey = keyof typeof PREFIXES;

	function formatDateTime(date?: string, time?: string): string {
		if (!date) return '';
		const d = new Date(date);
		const day = d.toLocaleDateString(undefined, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
		const timeStr = time
			? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
			: '';
		return time ? `${day} ${timeStr}` : day;
	}

	type MetadataItem = {
		field: FieldKey;
		value: string;
		input: HTMLInputElement | null;
		prefix: string;
		placeHolder: string;
	};

	function buildInitialMetadata(item: Todo): MetadataItem[] {
		const list: MetadataItem[] = [
			{
				field: 'notes',
				value: item.notes || '',
				input: null,
				prefix: PREFIXES.notes,
				placeHolder: 'add details or notes...'
			},
			{
				field: 'dateTime',
				value: formatDateTime(item.startDate, item.startTime),
				input: null,
				prefix: PREFIXES.dateTime,
				placeHolder: 'e.g. tomorrow 3pm'
			},
			{
				field: 'deadline',
				value: formatDateTime(item.dueDate, item.endTime),
				input: null,
				prefix: PREFIXES.deadline,
				placeHolder: 'e.g. Friday 5pm'
			},
			{
				field: 'repeat',
				value: item.interval || '',
				input: null,
				prefix: PREFIXES.repeat,
				placeHolder: 'e.g. day, weekday, weekend'
			},
			{
				field: 'priority',
				value: item.priority || '',
				input: null,
				prefix: PREFIXES.priority,
				placeHolder: 'e.g. high, medium, or low'
			}
		];
		// sort by filled value
		return list.sort((a, b) => {
			if (a.value && !b.value) return -1;
			if (!a.value && b.value) return 1;
			return 0;
		});
	}

	// Card interaction state
	let isSaving = $state(false);
	let isEditingTitle = $state(false);
	let showMore = $state(false);

	// Form draft values
	let title = $state(untrack(() => todo.title));
	let titleInput = $state<HTMLInputElement | null>(null);
	let metadata = $state<MetadataItem[]>(untrack(() => buildInitialMetadata(todo)));
	let visibleMetadata = $derived.by(() => {
		if (showMore) {
			return metadata;
		}
		const filled = metadata.filter((m) => m.value).length;
		return metadata.slice(0, filled <= 2 ? 2 : filled);
	});

	// Synchronize state when the todo prop updates externally (e.g. from database/store updates)
	let lastUpdatedAt = $state(untrack(() => todo.updatedAt));
	let lastTodoId = $state(untrack(() => todo.id));

	$effect(() => {
		if (!isExpanded) {
			showMore = false;
		}
	});

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

	async function toggleField(field: FieldKey) {
		const isCurrentlyShown = getShowState(field);

		if (isCurrentlyShown) {
			metadata = metadata.filter((m) => m.field !== field);
			await handleSave();
		} else {
			let placeHolder = '';
			switch (field) {
				case 'notes':
					placeHolder = 'add details or notes...';
					break;
				case 'dateTime':
					placeHolder = 'e.g. tomorrow at 3pm';
					break;
				case 'deadline':
					placeHolder = 'e.g. Friday by 5pm';
					break;
				case 'repeat':
					placeHolder = 'e.g. daily, weekday, weekend';
					break;
				case 'priority':
					placeHolder = 'e.g. high, medium, or low';
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
				showMore = false;
				metadata = buildInitialMetadata(result.data);
			}
		} finally {
			isSaving = false;
		}
	}

	async function handleCheck(e?: MouseEvent) {
		e?.stopPropagation();
		if (!todo.isCompleted) {
			await todoState.complete(todo.id);
		} else {
			await todoState.incomplete(todo.id);
		}
	}

	async function handleDelete(e?: MouseEvent) {
		e?.stopPropagation();
		await todoState.delete(todo.id);
	}

	async function handleCardClick(e: MouseEvent) {
		e.stopPropagation();
		const target = e.target as HTMLElement | null;
		// Don't toggle if user clicked on button, input, or interactive controls
		if (target?.closest('button') || target?.closest('input')) {
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
			? 'gap-3 border-primary/40 py-3.5 shadow-none ring-2 ring-primary/20 dark:ring-primary/50'
			: 'cursor-pointer gap-0 py-3'}
			{className}
		"
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
					placeholder="Task title..."
					class="w-full bg-transparent text-sm font-medium transition-colors outline-none {todo.isCompleted
						? 'text-muted-foreground line-through'
						: 'text-foreground'}"
				/>
			</div>

			<!-- Right quick actions -->
			<div class="group relative flex items-center gap-1">
				{#if !isExpanded && metadata.some((m) => m.value)}
					<Badge
						class="relative -right-8 h-6 min-w-6 shrink-0 rounded-full bg-primary/10 px-0 font-mono text-xs text-primary tabular-nums transition-all duration-200 group-hover/item:right-0"
						variant="default">+{metadata.filter((m) => m.value).length}</Badge
					>
				{/if}
				<Button
					size="icon-sm"
					variant="ghost"
					onclick={handleDelete}
					title="Delete task"
					class="shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover/item:opacity-100 hover:bg-destructive/10 hover:text-destructive"
				>
					<Trash2 size={16} />
				</Button>

				<Button
					size="icon-sm"
					variant="ghost"
					onclick={toggleExpand}
					title={isExpanded ? 'Collapse' : 'Expand details'}
					class="relative shrink-0 text-muted-foreground transition-transform duration-200 hover:text-foreground"
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
			<div class="flex animate-in flex-col gap-3 px-4 duration-150 fade-in-50">
				<!-- created and completed at -->
				<div class="flex w-full items-center gap-1 px-1.5 text-xs text-muted-foreground">
					<p>
						Created: {formatDateTime(todo.createdAt)}
					</p>
					{#if todo.completedAt}
						<span>•</span>
						<p>
							Completed: {formatDateTime(todo.completedAt)}
						</p>
					{/if}
				</div>
				<!-- Metadata items editor -->
				<div class="flex flex-col gap-1.5">
					{#each visibleMetadata as item (item.field)}
						<div
							class="flex items-center gap-1.5 px-1 py-1 text-sm text-muted-foreground transition-all duration-300"
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
						</div>
					{/each}

					<button
						type="button"
						onclick={() => (showMore = !showMore)}
						class="mt-0.5 inline-flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						<span>{showMore ? 'Show less' : 'See more'}</span>
						<ChevronDown
							size={12}
							class="transition-transform duration-200 {showMore ? 'rotate-180' : ''}"
						/>
					</button>
				</div>

				<!-- Card Action Footer -->
				<div class="flex items-center justify-end gap-2 pt-1">
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
							Save
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</Card.Root>
</div>
