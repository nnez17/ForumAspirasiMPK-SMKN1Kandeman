import { treaty } from "@elysia/eden";
import type { App } from "@/api/elysia";

const getBaseUrl = () => {
	if (typeof window !== "undefined") return window.location.origin;
	return "https://mpkskansaka.vercel.app";
};

export const { api } = treaty<App>(getBaseUrl());
