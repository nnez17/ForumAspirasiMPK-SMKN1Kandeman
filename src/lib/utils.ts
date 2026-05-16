import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any }
	? Omit<T, "children">
	: T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
	ref?: U | null;
};

export function getImageUrl(path: string | undefined | null) {
	if (!path) return "";
	if (
		path.startsWith("http") ||
		path.startsWith("/") ||
		path.startsWith("data:") ||
		path.startsWith("blob:")
	) {
		return path;
	}
	return `/i/${path}`;
}

export function getOptimizedImageUrl(
	path: string | undefined | null,
	width = 600,
	height = 800,
	format = "webp",
) {
	const rawUrl = getImageUrl(path);
	if (!rawUrl || rawUrl.startsWith("data:") || rawUrl.startsWith("blob:"))
		return rawUrl;

	// Determine base URL depending on whether we are in browser or SSR
	const baseUrl =
		typeof window !== "undefined"
			? window.location.origin
			: "http://localhost:4321";
	const absoluteUrl = rawUrl.startsWith("http")
		? rawUrl
		: `${baseUrl}${rawUrl}`;

	// Construct Astro's /_image endpoint URL
	const params = new URLSearchParams({
		href: absoluteUrl,
		w: width.toString(),
		h: height.toString(),
		f: format,
	});

	return `/_image?${params.toString()}`;
}
