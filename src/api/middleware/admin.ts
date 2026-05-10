import type { Elysia } from "elysia";

export default (app: Elysia) =>
	app.onBeforeHandle(({ set, headers }) => {
		const apiKey = headers["x-api-key"];
		const adminKey = import.meta.env.ADMIN_XKEY;

		if (!adminKey || apiKey !== adminKey) {
			set.status = 401;
			return {
				success: false,
				message: "Unauthorized access",
			};
		}
	});
