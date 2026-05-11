import { treaty } from "@elysia/eden";
import type { App } from "../api/elysia";

const getBaseUrl = () => {
	if (typeof window !== "undefined") return window.location.origin;
	return "http://localhost:4321";
};

export const { api } = treaty<App>(getBaseUrl());
