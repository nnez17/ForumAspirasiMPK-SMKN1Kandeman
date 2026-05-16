// @ts-check

import svelte from "@astrojs/svelte";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import path from "node:path";

// https://astro.build/config
export default defineConfig({
	output: "server",
	integrations: [svelte()],
	adapter: vercel(),
	image: {
		remotePatterns: [{ protocol: "https" }, { protocol: "http" }],
	},
	vite: {
		plugins: [tailwindcss()],
		ssr: {
			noExternal: ["@vercel/blob", "elysia"],
		},
		resolve: {
			alias: {
				undici: path.resolve("./src/lib/undici-shim.js"),
			},
		},
	},
});
