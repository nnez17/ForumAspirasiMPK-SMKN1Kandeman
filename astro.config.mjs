// @ts-check

import svelte from "@astrojs/svelte";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	output: "server",
	integrations: [svelte()],
	adapter: vercel({
		includeFiles: ["./node_modules/undici/**/*"],
	}),
	vite: {
		plugins: [tailwindcss()],
		ssr: {
			noExternal: ["@vercel/blob", "elysia"],
			external: ["undici"],
		},
	},
});
