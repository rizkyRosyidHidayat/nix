<script lang="ts">
	import { untrack, tick } from 'svelte';
	import { todoState } from '$lib/features/todo';
	import * as Carousel from '$lib/components/ui/carousel';
	import * as Card from '$lib/components/ui/card';
	import { type CarouselAPI } from '$lib/components/ui/carousel/context';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight, ChevronDown, RotateCcw } from '@lucide/svelte';
	import { SvelteDate, SvelteSet } from 'svelte/reactivity';
	import TodoItem from './TodoItem.svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
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
		isCurrentMonth: boolean;
		month: number;
		year: number;
	}

	interface WeekItem {
		id: string;
		days: DayItem[];
		label: string;
		monthName: string;
		month: number;
		year: number;
	}

	interface MonthItem {
		id: string;
		month: number;
		year: number;
		monthName: string;
		shortMonthName: string;
		label: string;
		days: DayItem[];
	}

	const now = new SvelteDate();
	const todayStr = formatLocalDate(now);
	const baseMonday = getMonday(now);

	// Week Generation
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
					isCurrentMonth: true,
					month: dayDate.getMonth(),
					year: dayDate.getFullYear()
				});
			}

			const firstDay = days[0];
			const lastDay = days[6];
			let label: string;
			if (firstDay.month === lastDay.month) {
				label = `${MONTH_NAMES[firstDay.month]} ${firstDay.year}`;
			} else {
				label = `${SHORT_MONTH_NAMES[firstDay.month]} - ${SHORT_MONTH_NAMES[lastDay.month]} ${lastDay.year}`;
			}

			list.push({
				id: `week-${firstDay.dateStr}`,
				days,
				label,
				monthName: MONTH_NAMES[firstDay.month],
				month: firstDay.month,
				year: firstDay.year
			});
		}
		return list;
	}

	// Month Generation
	const TOTAL_PAST_MONTHS = 24;
	const TOTAL_FUTURE_MONTHS = 24;
	const currentMonthIndex = TOTAL_PAST_MONTHS;

	function generateMonths(): MonthItem[] {
		const list: MonthItem[] = [];
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth();

		for (let offset = -TOTAL_PAST_MONTHS; offset <= TOTAL_FUTURE_MONTHS; offset++) {
			const targetDate = new Date(currentYear, currentMonth + offset, 1);
			const year = targetDate.getFullYear();
			const month = targetDate.getMonth();
			const monthName = MONTH_NAMES[month];
			const shortMonthName = SHORT_MONTH_NAMES[month];
			const label = `${monthName} ${year}`;

			const daysInMonth = new Date(year, month + 1, 0).getDate();
			const firstDayWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0 ... Sun=6
			const daysInPrevMonth = new Date(year, month, 0).getDate();

			const days: DayItem[] = [];

			// Leading days from previous month
			for (let i = firstDayWeekday - 1; i >= 0; i--) {
				const dayNum = daysInPrevMonth - i;
				const d = new Date(year, month - 1, dayNum);
				const dateStr = formatLocalDate(d);
				days.push({
					dateStr,
					dayNumber: dayNum,
					dayName: DAY_NAMES[(d.getDay() + 6) % 7],
					isToday: dateStr === todayStr,
					isCurrentMonth: false,
					month: d.getMonth(),
					year: d.getFullYear()
				});
			}

			// Days of current month
			for (let d = 1; d <= daysInMonth; d++) {
				const dateObj = new Date(year, month, d);
				const dateStr = formatLocalDate(dateObj);
				days.push({
					dateStr,
					dayNumber: d,
					dayName: DAY_NAMES[(dateObj.getDay() + 6) % 7],
					isToday: dateStr === todayStr,
					isCurrentMonth: true,
					month,
					year
				});
			}

			// Trailing days from next month to complete the week
			const remainder = days.length % 7;
			const trailingCount = remainder === 0 ? 0 : 7 - remainder;
			for (let t = 1; t <= trailingCount; t++) {
				const d = new Date(year, month + 1, t);
				const dateStr = formatLocalDate(d);
				days.push({
					dateStr,
					dayNumber: t,
					dayName: DAY_NAMES[(d.getDay() + 6) % 7],
					isToday: dateStr === todayStr,
					isCurrentMonth: false,
					month: d.getMonth(),
					year: d.getFullYear()
				});
			}

			list.push({
				id: `month-${year}-${String(month + 1).padStart(2, '0')}`,
				month,
				year,
				monthName,
				shortMonthName,
				label,
				days
			});
		}

		return list;
	}

	const weeks = generateWeeks();
	const months = generateMonths();

	// State
	let isMonthView = $state(false);
	let isSelected = $state(false);
	let selectedDate = $state<string>('');

	// Carousel states
	let weekCarouselApi = $state<CarouselAPI>();
	let monthCarouselApi = $state<CarouselAPI>();
	let activeWeekIndex = $state<number>(currentWeekIndex);
	let activeMonthIndex = $state<number>(currentMonthIndex);
	let canScrollPrevWeek = $state<boolean>(true);
	let canScrollNextWeek = $state<boolean>(true);
	let canScrollPrevMonth = $state<boolean>(true);
	let canScrollNextMonth = $state<boolean>(true);

	let expandedItems = $state<Record<string, boolean>>({});
	let dropdownRef = $state<HTMLDivElement | null>(null);

	let dateTodos = $derived(todoState.todosByDate);

	// Derived current items
	let currentWeek = $derived(weeks[activeWeekIndex] || weeks[currentWeekIndex]);
	let currentMonth = $derived(months[activeMonthIndex] || months[currentMonthIndex]);

	let currentLabel = $derived(isMonthView ? currentMonth?.label : currentWeek?.label);

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
		if (isMonthView) {
			monthCarouselApi?.scrollTo(currentMonthIndex);
			activeMonthIndex = currentMonthIndex;
		} else {
			weekCarouselApi?.scrollTo(currentWeekIndex);
			activeWeekIndex = currentWeekIndex;
		}
		await tick();
		scrollToDropdown();
	}

	async function toggleMonthView() {
		isMonthView = !isMonthView;
		await tick();
		if (isMonthView) {
			const targetDateStr = selectedDate || (currentWeek?.days[0]?.dateStr ?? todayStr);
			const [y, m] = targetDateStr.split('-').map(Number);
			const monthIdx = months.findIndex((mItem) => mItem.year === y && mItem.month === m - 1);
			if (monthIdx !== -1) {
				monthCarouselApi?.scrollTo(monthIdx);
				activeMonthIndex = monthIdx;
			}
		} else {
			const targetDateStr = selectedDate || todayStr;
			const targetMs = new Date(targetDateStr).getTime();
			const weekIdx = weeks.findIndex((w) => {
				const startMs = new Date(w.days[0].dateStr).getTime();
				const endMs = new Date(w.days[6].dateStr).getTime();
				return targetMs >= startMs && targetMs <= endMs;
			});
			if (weekIdx !== -1) {
				weekCarouselApi?.scrollTo(weekIdx);
				activeWeekIndex = weekIdx;
			}
		}
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
			const targetDate = todo.createdAt ? todo.createdAt.split('T')[0] : '';
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

	$effect(() => {
		const isAnyExpanded = Object.values(expandedItems).some(Boolean);
		if (isSelected && isAnyExpanded) {
			scrollToDropdown();
		}
	});

	function handleWeekCarouselInit(api: CarouselAPI | undefined) {
		weekCarouselApi = api;
		if (!api) return;
		api.on('select', () => {
			activeWeekIndex = api.selectedScrollSnap();
			canScrollPrevWeek = api.canScrollPrev();
			canScrollNextWeek = api.canScrollNext();
		});
	}

	function handleMonthCarouselInit(api: CarouselAPI | undefined) {
		monthCarouselApi = api;
		if (!api) return;
		api.on('select', () => {
			activeMonthIndex = api.selectedScrollSnap();
			canScrollPrevMonth = api.canScrollPrev();
			canScrollNextMonth = api.canScrollNext();
		});
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- Backdrop overlay when date is selected -->
{#if isSelected && selectedDate}
	<div
		role="presentation"
		aria-hidden="true"
		data-backdrop="todo-date"
		class="fixed inset-0 z-40 bg-background/60 backdrop-blur-xs transition-all duration-300"
		transition:fade={{ duration: 200 }}
		onclick={(e) => {
			e.stopPropagation();
			onClose();
		}}
	></div>
{/if}

<div
	class="relative w-full max-w-md animate-in transition-all duration-300 ease-out fade-in slide-in-from-bottom-4 {isSelected &&
	selectedDate
		? 'z-50'
		: 'z-10'}"
>
	<!-- Date Carousel Card (Week by default, expandable to Month) -->
	<Card.Root
		class="w-full py-3 transition-all duration-300 ease-out {isSelected && selectedDate
			? 'border-primary/40 shadow-md ring-2 ring-primary/20 dark:ring-primary/50'
			: 'backdrop-blur-sm'}"
	>
		<Card.Content class="px-3">
			<!-- Navigation Bar -->
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center gap-2 pl-1">
					<h2 class="text-sm font-semibold tracking-tight text-foreground sm:text-base">
						{currentLabel}
					</h2>
					{#if (selectedDate && selectedDate !== todayStr) || (isMonthView ? activeMonthIndex !== currentMonthIndex : activeWeekIndex !== currentWeekIndex)}
						<Button
							onclick={jumpToToday}
							variant="outline"
							size="xs"
							class="h-6 items-center rounded-full border border-primary/20 bg-primary/10 text-primary transition-all hover:bg-primary/10 hover:text-primary dark:border-primary/50 dark:bg-primary/20"
						>
							<RotateCcw size={10} />
							Today
						</Button>
					{/if}
				</div>

				<div class="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={() =>
							isMonthView ? monthCarouselApi?.scrollPrev() : weekCarouselApi?.scrollPrev()}
						disabled={isMonthView ? !canScrollPrevMonth : !canScrollPrevWeek}
						title={isMonthView ? 'Previous month' : 'Previous week'}
						class="text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						<ChevronLeft size={16} />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={() =>
							isMonthView ? monthCarouselApi?.scrollNext() : weekCarouselApi?.scrollNext()}
						disabled={isMonthView ? !canScrollNextMonth : !canScrollNextWeek}
						title={isMonthView ? 'Next month' : 'Next week'}
						class="text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						<ChevronRight size={16} />
					</Button>
				</div>
			</div>

			<!-- Fixed Weekday Header -->
			<div class="mb-1.5 grid grid-cols-7 gap-1 text-center">
				{#each DAY_NAMES as dayName (dayName)}
					<span
						class="text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase sm:text-xs"
					>
						{dayName}
					</span>
				{/each}
			</div>

			<!-- Carousel Slider: Week View vs Month View -->
			{#if isMonthView}
				<Carousel.Root
					opts={{
						startIndex: activeMonthIndex,
						align: 'start',
						loop: false
					}}
					setApi={handleMonthCarouselInit}
					class="w-full"
				>
					<Carousel.Content class="-ms-2">
						{#each months as month (month.id)}
							<Carousel.Item class="basis-full ps-2">
								<div class="grid grid-cols-7 gap-1 sm:gap-1.5">
									{#each month.days as day (day.dateStr)}
										{@const isCurrentSelected = selectedDate === day.dateStr}
										{@const hasTodos = datesWithTodos.has(day.dateStr)}
										<button
											type="button"
											disabled={!hasTodos}
											onclick={() => selectDate(day.dateStr)}
											class="group relative flex h-9 w-full flex-col items-center justify-center rounded-xl text-center text-xs transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:text-sm
												{isCurrentSelected
												? 'bg-primary font-semibold text-primary-foreground shadow-xs'
												: day.isToday && hasTodos
													? 'border border-primary/40 bg-primary/10 font-semibold text-primary hover:bg-primary/20 dark:bg-primary/20'
													: day.isToday
														? 'border border-muted-foreground/30 font-medium text-foreground'
														: hasTodos
															? 'bg-muted/50 font-medium text-foreground hover:bg-muted/80'
															: day.isCurrentMonth
																? 'text-muted-foreground/50'
																: 'text-muted-foreground/20'}"
										>
											<span>{day.dayNumber}</span>
										</button>
									{/each}
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>
				</Carousel.Root>
			{:else}
				<Carousel.Root
					opts={{
						startIndex: activeWeekIndex,
						align: 'start',
						loop: false
					}}
					setApi={handleWeekCarouselInit}
					class="w-full"
				>
					<Carousel.Content class="-ms-2">
						{#each weeks as week (week.id)}
							<Carousel.Item class="basis-full ps-2">
								<div class="grid grid-cols-7 gap-1 sm:gap-1.5">
									{#each week.days as day (day.dateStr)}
										{@const isCurrentSelected = selectedDate === day.dateStr}
										{@const hasTodos = datesWithTodos.has(day.dateStr)}
										<button
											type="button"
											disabled={!hasTodos}
											onclick={() => selectDate(day.dateStr)}
											class="group relative flex h-9 w-full flex-col items-center justify-center rounded-xl text-center text-xs transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:text-sm
												{isCurrentSelected
												? 'bg-primary font-semibold text-primary-foreground shadow-xs'
												: day.isToday && hasTodos
													? 'border border-primary/40 bg-primary/10 font-semibold text-primary hover:bg-primary/20 dark:bg-primary/20'
													: day.isToday
														? 'border border-muted-foreground/30 font-medium text-foreground'
														: hasTodos
															? 'bg-muted/50 font-medium text-foreground hover:bg-muted/80'
															: 'text-muted-foreground/50'}"
										>
											<span>{day.dayNumber}</span>
										</button>
									{/each}
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>
				</Carousel.Root>
			{/if}

			<!-- Toggle View Button (See full month / Show less) -->
			<div class="mt-2.5 flex justify-center border-t border-border/40 pt-2">
				<button
					type="button"
					onclick={toggleMonthView}
					class="inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/80 hover:text-foreground"
				>
					<span>{isMonthView ? 'Show less' : 'See full month'}</span>
					<ChevronDown
						size={13}
						class="transition-transform duration-200 {isMonthView ? 'rotate-180' : ''}"
					/>
				</button>
			</div>
		</Card.Content>
	</Card.Root>

	{#if !isSelected}
		<p class="mt-4 text-center text-sm text-muted-foreground/70">
			Dates without tasks are disabled.
		</p>
	{/if}

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
				<div class="flex items-center justify-between px-1 pb-1 text-sm text-muted-foreground">
					<span>
						{dateTodos.isLoading
							? 'Loading tasks...'
							: dateTodos.data.length === 1
								? '1 task'
								: `${dateTodos.data.length} tasks`}
					</span>
					{#if formattedSelectedDate}
						<span class="text-sm opacity-70">
							{formattedSelectedDate}
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
										class="shadow-none ring-0"
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
						<p class="text-sm font-medium text-foreground">No tasks added for this date</p>
						<p class="text-xs text-muted-foreground">Choose another date or create a new task</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
