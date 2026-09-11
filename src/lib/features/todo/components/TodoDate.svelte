<script lang="ts">
	import { untrack, tick } from 'svelte';
	import { todoState } from '$lib/features/todo';
	import * as Carousel from '$lib/components/ui/carousel';
	import * as Card from '$lib/components/ui/card';
	import { type CarouselAPI } from '$lib/components/ui/carousel/context';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight, RotateCcw } from '@lucide/svelte';
	import { SvelteDate, SvelteSet } from 'svelte/reactivity';
	import TodoItem from './TodoItem.svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Kbd } from '$lib/components/ui/kbd';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	const MONTH_NAMES = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	const SHORT_MONTH_NAMES = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];

	const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	function formatLocalDate(d: Date): string {
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getMonday(d: Date): Date {
		const date = new SvelteDate(d.getFullYear(), d.getMonth(), d.getDate());
		const day = date.getDay();
		const diff = date.getDate() - day + (day === 0 ? -6 : 1);
		return new Date(date.setDate(diff));
	}

	interface DayItem {
		dateStr: string;
		dayNumber: number;
		dayName: string;
		isToday: boolean;
		month: number;
		year: number;
	}

	interface WeekItem {
		id: string;
		days: DayItem[];
		label: string;
		monthName: string;
		year: number;
	}

	const now = new SvelteDate();
	const todayStr = formatLocalDate(now);
	const baseMonday = getMonday(now);

	const TOTAL_PAST_WEEKS = 26;
	const TOTAL_FUTURE_WEEKS = 26;
	const currentWeekIndex = TOTAL_PAST_WEEKS;

	function generateWeeks(): WeekItem[] {
		const list: WeekItem[] = [];
		for (let offset = -TOTAL_PAST_WEEKS; offset <= TOTAL_FUTURE_WEEKS; offset++) {
			const monday = new Date(baseMonday.getTime() + offset * 7 * 86400000);
			const days: DayItem[] = [];

			for (let d = 0; d < 7; d++) {
				const dayDate = new Date(monday.getTime() + d * 86400000);
				const dateStr = formatLocalDate(dayDate);
				days.push({
					dateStr,
					dayNumber: dayDate.getDate(),
					dayName: DAY_NAMES[d],
					isToday: dateStr === todayStr,
					month: dayDate.getMonth(),
					year: dayDate.getFullYear()
				});
			}

			const firstDay = days[0];
			const lastDay = days[6];
			let label;
			if (firstDay.month === lastDay.month) {
				label = `${SHORT_MONTH_NAMES[firstDay.month]}, ${firstDay.year}`;
			} else {
				label = `${SHORT_MONTH_NAMES[firstDay.month]}, ${lastDay.year}`;
			}

			list.push({
				id: `week-${firstDay.dateStr}`,
				days,
				label,
				monthName: MONTH_NAMES[firstDay.month],
				year: firstDay.year
			});
		}
		return list;
	}

	const weeks = generateWeeks();

	// State
	let isSelected = $state(false);
	let selectedDate = $state<string>('');
	let carouselApi = $state<CarouselAPI>();
	let activeWeekIndex = $state<number>(currentWeekIndex);
	let canScrollPrev = $state<boolean>(true);
	let canScrollNext = $state<boolean>(true);
	let expandedItems = $state<Record<string, boolean>>({});
	let dropdownRef = $state<HTMLDivElement | null>(null);

	let dateTodos = $derived(todoState.todosByDate);

	// Derived
	let currentWeek = $derived(weeks[activeWeekIndex] || weeks[currentWeekIndex]);

	let formattedSelectedDate = $derived.by(() => {
		if (!selectedDate) return '';
		const [y, m, d] = selectedDate.split('-').map(Number);
		const date = new Date(y, m - 1, d);
		return date.toLocaleDateString(undefined, {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	});

	function scrollToDropdown() {
		if (typeof window === 'undefined') return;
		setTimeout(() => {
			dropdownRef?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			window.scrollTo({
				top: document.documentElement.scrollHeight,
				behavior: 'smooth'
			});
		}, 80);
	}

	async function selectDate(dateStr: string) {
		selectedDate = dateStr;
		isSelected = true;
		await tick();
		scrollToDropdown();
	}

	async function jumpToToday() {
		selectedDate = todayStr;
		isSelected = true;
		carouselApi?.scrollTo(currentWeekIndex);
		await tick();
		scrollToDropdown();
	}

	function onClose() {
		selectedDate = '';
		isSelected = false;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isSelected) {
			onClose();
		}
	}

	let datesWithTodos = $derived.by(() => {
		const dates = new SvelteSet<string>();
		for (const todo of todoState.todos.data) {
			const targetDate =
				todo.dueDate || todo.startDate || (todo.createdAt ? todo.createdAt.split('T')[0] : '');
			if (targetDate) {
				dates.add(targetDate);
			}
		}
		return dates;
	});

	// Re-fetch todos whenever selectedDate changes
	$effect(() => {
		const targetDate = selectedDate;
		if (!targetDate) return;
		untrack(() => {
			todoState.listByDate(targetDate);
		});
	});

	$effect(() => {
		if (isSelected && selectedDate && !dateTodos.isLoading) {
			scrollToDropdown();
		}
	});

	function handleCarouselInit(api: CarouselAPI | undefined) {
		carouselApi = api;
		if (!api) return;
		api.on('select', () => {
			activeWeekIndex = api.selectedScrollSnap();
			canScrollPrev = api.canScrollPrev();
			canScrollNext = api.canScrollNext();
		});
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- Backdrop overlay when date is selected -->
{#if isSelected && selectedDate}
	<div
		role="presentation"
		aria-hidden="true"
		class="fixed inset-0 z-40 bg-background/60 backdrop-blur-xs transition-all duration-300"
		transition:fade={{ duration: 200 }}
		onclick={onClose}
	></div>
{/if}

<div
	class="relative w-full max-w-md transition-all duration-300 ease-out {isSelected && selectedDate
		? 'z-50'
		: 'z-10'}"
>
	<!-- Weekly Date Carousel Card -->
	<Card.Root
		class="w-full py-3 transition-all duration-300 ease-out {isSelected && selectedDate
			? 'border-primary/40 shadow-md ring-2 ring-primary/20'
			: 'backdrop-blur-sm'}"
	>
		<Card.Content class="px-3">
			<!-- Week Navigation Bar -->
			<div class="mb-2 flex items-center justify-between">
				<div class="flex items-center gap-2 pl-1">
					<h2 class="text-xs tracking-tight text-foreground">
						{currentWeek?.label}
					</h2>
					{#if selectedDate && selectedDate !== todayStr}
						<Button
							onclick={jumpToToday}
							variant="outline"
							size="xs"
							class="h-6 items-center rounded-full border border-primary/20 bg-primary/10 text-primary transition-all hover:bg-primary/10 hover:text-primary"
						>
							<RotateCcw size={10} />
							Today
						</Button>
					{/if}
				</div>

				<div class="flex items-center gap-1">
					{#if isSelected && selectedDate}
						<Kbd class="mr-1">ESC</Kbd>
					{/if}
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={() => carouselApi?.scrollPrev()}
						disabled={!canScrollPrev}
						title="Previous week"
						class="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						<ChevronLeft size={16} />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={() => carouselApi?.scrollNext()}
						disabled={!canScrollNext}
						title="Next week"
						class="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						<ChevronRight size={16} />
					</Button>
				</div>
			</div>

			<!-- Carousel Slider -->
			<Carousel.Root
				opts={{
					startIndex: currentWeekIndex,
					align: 'start',
					loop: false
				}}
				setApi={handleCarouselInit}
				class="w-full"
			>
				<Carousel.Content class="-ms-2">
					{#each weeks as week (week.id)}
						<Carousel.Item class="basis-full ps-2">
							<div class="grid grid-cols-7 gap-1 sm:gap-3">
								{#each week.days as day (day.dateStr)}
									{@const isCurrentSelected = selectedDate === day.dateStr}
									{@const hasTodos = datesWithTodos.has(day.dateStr)}
									<button
										type="button"
										disabled={!hasTodos}
										onclick={() => selectDate(day.dateStr)}
										class="group relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 pb-2.5 text-center transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50
											{isCurrentSelected
											? 'scale-[1.04] bg-primary font-semibold text-primary-foreground shadow-md'
											: day.isToday && hasTodos
												? `border border-primary/40 bg-primary/10 font-medium text-primary hover:bg-primary/20`
												: hasTodos
													? 'bg-muted/40 font-medium text-foreground hover:bg-muted/80'
													: 'text-muted-foreground/50'}"
									>
										<span
											class="text-[10px] font-medium tracking-wider uppercase sm:text-xs {isCurrentSelected
												? 'text-primary-foreground/90'
												: day.isToday && hasTodos
													? 'text-primary/70'
													: hasTodos
														? 'text-foreground/80'
														: 'text-muted-foreground/50'}"
										>
											{day.dayName}
										</span>
										<span class="text-xs font-semibold sm:text-sm">
											{day.dayNumber}
										</span>
									</button>
								{/each}
							</div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
			</Carousel.Root>
		</Card.Content>
	</Card.Root>

	<!-- Date Results Dropdown -->
	{#if isSelected && selectedDate}
		<div
			bind:this={dropdownRef}
			in:fly={{ y: 8, duration: 200, easing: cubicOut }}
			out:fade={{ duration: 150 }}
			class="absolute top-full mt-2 w-full"
		>
			<div
				class="mb-8 flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-3 shadow-md backdrop-blur-md"
			>
				<!-- Results Header -->
				<div class="flex items-center justify-between px-1 pb-1 text-xs text-muted-foreground">
					<span>
						{dateTodos.isLoading
							? 'Loading tasks...'
							: dateTodos.data.length === 1
								? '1 task found'
								: `${dateTodos.data.length} tasks found`}
					</span>
					{#if formattedSelectedDate}
						<span class="text-[11px] opacity-70">
							Showing {formattedSelectedDate}
						</span>
					{/if}
				</div>

				<!-- Results List -->
				{#if dateTodos.isLoading}
					<div
						class="flex items-center justify-center py-6 text-center text-xs text-muted-foreground"
					>
						Loading tasks...
					</div>
				{:else if dateTodos.data.length > 0}
					<ScrollArea class="max-h-[40vh] pr-1">
						<div class="flex flex-col gap-2">
							{#each dateTodos.data as todo (todo.id)}
								<div class="w-full">
									<TodoItem
										class="border-border/50 shadow-none ring-0"
										{todo}
										bind:isExpanded={expandedItems[todo.id]}
									/>
								</div>
							{/each}
						</div>
					</ScrollArea>
				{:else}
					<div
						class="flex flex-col items-center justify-center gap-1.5 py-6 text-center text-muted-foreground"
					>
						<p class="text-xs font-medium text-foreground">No todos scheduled for this day</p>
						<p class="text-[11px] text-muted-foreground">Select another date or create a task</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
