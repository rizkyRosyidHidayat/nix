<script lang="ts">
	import { untrack } from 'svelte';
	import Container from '$lib/components/global/Container.svelte';
	import { todoState } from '$lib/features/todo';
	import * as Carousel from '$lib/components/ui/carousel';
	import { type CarouselAPI } from '$lib/components/ui/carousel/context';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight, RotateCcw } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import { SvelteDate } from 'svelte/reactivity';
	import TodoStackedList from '$lib/features/todo/components/TodoStackedList.svelte';

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
	let selectedDate = $state<string>(todayStr);
	let carouselApi = $state<CarouselAPI>();
	let activeWeekIndex = $state<number>(currentWeekIndex);
	let canScrollPrev = $state<boolean>(true);
	let canScrollNext = $state<boolean>(true);

	let dateTodos = $derived(todoState.todosByDate);

	// Derived
	let currentWeek = $derived(weeks[activeWeekIndex] || weeks[currentWeekIndex]);

	function selectDate(dateStr: string) {
		selectedDate = dateStr;
	}

	function jumpToToday() {
		selectedDate = todayStr;
		carouselApi?.scrollTo(currentWeekIndex);
	}

	// Re-fetch todos whenever selectedDate changes
	$effect(() => {
		const targetDate = selectedDate;
		untrack(() => {
			todoState.listByDate(targetDate);
		});
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

<svelte:head>
	<title>Discover All Todos | Nix</title>
	<meta
		name="description"
		content="Explore and organize all your todos by date with an interactive weekly calendar."
	/>
</svelte:head>

<Container class="max-w-md">
	<!-- Page Header -->
	<h1 class="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">Discover all todo list</h1>

	<!-- Weekly Date Carousel Card -->
	<div class="w-full">
		<!-- Week Navigation Bar -->
		<div class="mb-2 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<h2 class="text-xs tracking-tight text-foreground">
					{currentWeek?.label}
				</h2>
				{#if selectedDate !== todayStr}
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
								{@const isSelected = selectedDate === day.dateStr}
								<button
									type="button"
									onclick={() => selectDate(day.dateStr)}
									class="group relative flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center transition-all duration-200 outline-none
										{isSelected
										? 'scale-[1.04] bg-primary font-semibold text-primary-foreground shadow-md'
										: day.isToday
											? 'border border-primary/40 bg-primary/10 font-medium text-primary hover:bg-primary/20'
											: 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}"
								>
									<span
										class="text-[10px] font-medium tracking-wider uppercase sm:text-xs {isSelected
											? 'text-primary-foreground/90'
											: day.isToday
												? 'text-primary/70'
												: 'text-muted-foreground'}"
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
	</div>

	<!-- Todo List for Selected Date -->
	<div class="min-h-24 w-full" role="list" aria-label="Todos for selected date">
		{#if dateTodos.isLoading && dateTodos.data.length === 0}
			<p
				class="animate-in text-center text-xs text-muted-foreground duration-500 fade-in slide-in-from-bottom-4"
			>
				Loading tasks...
			</p>
		{:else if dateTodos.data.length === 0}
			<!-- Empty State -->
			<div
				in:fade={{ duration: 200 }}
				class="flex animate-in flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center duration-500 fade-in slide-in-from-bottom-4"
			>
				<h3 class="text-sm text-muted-foreground">No todo added for this day</h3>
			</div>
		{:else}
			<div class="animate-in duration-500 fade-in slide-in-from-bottom-4">
				<TodoStackedList todos={dateTodos.data} />
			</div>
		{/if}
	</div>
</Container>
