import type { APIRoute } from "astro";

export const GET: APIRoute = ({ params, redirect }) => {
	const path = params.path;
	const baseUrl = import.meta.env.BLOB_BASE_URL;

	if (!baseUrl) {
		return new Response(
			JSON.stringify({
				success: false,
				message: "BLOB_BASE_URL is not configured",
			}),
			{ status: 500 },
		);
	}

	return redirect(`${baseUrl}/images/${path}`, 302);
};
