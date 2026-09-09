import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export type ReturnState = 'pending' | 'success' | 'error';
export interface ReturnType<T> {
	isLoading: boolean;
	data: T;
	state: ReturnState;
	error?: string;
}

export function clickOutside(node: HTMLElement, callback: () => void) {
	const handleClick = (event: MouseEvent) => {
		// Check if the click happened outside the node and its children
		if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
			callback();
		}
	};

	// Attach listener to the document
	document.addEventListener('click', handleClick, true);

	return {
		update(newCallback: () => void) {
			// Update callback reference if it changes dynamically
			callback = newCallback;
		},
		destroy() {
			// Clean up the event listener when the component unmounts
			document.removeEventListener('click', handleClick, true);
		}
	};
}
