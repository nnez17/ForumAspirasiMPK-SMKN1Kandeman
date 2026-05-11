import Elysia, { t } from "elysia";

export default new Elysia({
	prefix: "/key",
	detail: {
		tags: ["Key"],
	},
}).get(
	"/",
	async ({ query }) => {
		const { secret } = query;

		if (secret !== import.meta.env.ADMIN_PASSWORD) {
			return {
				success: false,
				message: "Secret tidak valid",
			};
		}

		return {
			success: true,
			key: import.meta.env.ADMIN_XKEY,
		};
	},
	{
		query: t.Object({
			secret: t.String(),
		}),
	},
);
