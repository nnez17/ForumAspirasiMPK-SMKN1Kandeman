import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import Elysia, { t } from "elysia";
import admin from "./middleware/admin";

export default new Elysia({
	prefix: "/misc",
	detail: {
		tags: ["Misc"],
	},
})
	.get(
		"/keys",
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
				data: {
					key: import.meta.env.ADMIN_XKEY,
				},
			};
		},
		{
			query: t.Object({
				secret: t.String(),
			}),
		},
	)
	.get("/images/*", ({ params, set, redirect }) => {
		const path = params["*"];
		const baseUrl = import.meta.env.BLOB_BASE_URL;

		if (!baseUrl) {
			set.status = 500;
			return {
				success: false,
				message: "BLOB_BASE_URL is not configured",
			};
		}

		return redirect(`${baseUrl}/images/${path}`);
	})

	.use(admin)
	.post("/upload", async ({ body, request }) => {
		return await handleUpload({
			body: body as HandleUploadBody,
			request,
			onBeforeGenerateToken: async () => {
				return {
					allowedContentTypes: [
						"image/jpeg",
						"image/png",
						"image/gif",
						"image/webp",
					],
					tokenPayload: JSON.stringify({}),
				};
			},
			onUploadCompleted: async ({ blob, tokenPayload }) => {
				console.log("Blob upload completed", blob, tokenPayload);
			},
		});
	})
	.delete("/images/*", async ({ params, set }) => {
		const path = params["*"];
		const baseUrl = import.meta.env.BLOB_BASE_URL;

		if (!baseUrl) {
			set.status = 500;
			return {
				success: false,
				message: "BLOB_BASE_URL is not configured",
			};
		}

		try {
			await del(`${baseUrl}/images/${path}`);
			return {
				success: true,
				message: "Image deleted successfully",
			};
		} catch (e: any) {
			set.status = 500;
			return {
				success: false,
				message: e.message,
			};
		}
	});
