import { openapi } from "@elysia/openapi";
import { Elysia, redirect } from "elysia";
import aspirasi from "./aspirasi";
import news from "./news";

export const app = new Elysia({ prefix: "/api" })
	.use(
		openapi({
			documentation: {
				info: {
					title: "Forum Apresiasi MPK SMKN 1 Kandeman",
					version: "1.0.0",
					description: "API for Forum Apresiasi MPK SMKN 1 Kandeman",
				},
				components: {
					securitySchemes: {
						"x-api-key": {
							type: "apiKey",
							in: "header",
							name: "x-api-key",
						},
					},
				},
			},
			path: "/docs",
		}),
	)
	.use(aspirasi)
	.use(news)
	.get("/", () => redirect("/api/docs"), { detail: { hide: true } });

export type App = typeof app;

export default app;
