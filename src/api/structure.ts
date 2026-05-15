import { Elysia, t } from "elysia";
import { db } from "@/lib/firebase";
import admin from "./middleware/admin";
import { leader, assistants, administration } from "@/data/Executive";
import { commissions } from "@/data/Commission";

const structureSchema = t.Object({
	executive: t.Object({
		leader: t.Object({
			role: t.String(),
			name: t.String(),
			class: t.String(),
			description: t.String(),
			image: t.String(),
			color: t.String(),
		}),
		assistants: t.Array(
			t.Object({
				role: t.String(),
				name: t.String(),
				class: t.String(),
				description: t.String(),
				image: t.String(),
				color: t.String(),
			}),
		),
		administration: t.Array(
			t.Object({
				role: t.String(),
				name: t.String(),
				class: t.String(),
				description: t.String(),
				image: t.String(),
				color: t.String(),
			}),
		),
	}),
	commissions: t.Array(
		t.Object({
			id: t.String(),
			title: t.String(),
			subtitle: t.String(),
			fullName: t.String(),
			description: t.String(),
			image: t.String(),
			coordinator: t.Object({
				name: t.String(),
				class: t.String(),
			}),
			members: t.Array(t.String()),
			color: t.String(),
		}),
	),
});

export default new Elysia({
	prefix: "/structure",
	detail: {
		tags: ["Structure"],
	},
})
	.get("/", async () => {
		try {
			const doc = await db.collection("settings").doc("structure").get();
			
			if (!doc.exists) {
				// Return default data from files if not in database
				return {
					success: true,
					data: {
						executive: { leader, assistants, administration },
						commissions,
					},
				};
			}

			return {
				success: true,
				data: doc.data(),
			};
		} catch (e: any) {
			return {
				success: false,
				message: `Gagal mengambil data struktur: ${e.message}`,
			};
		}
	})
	.use(admin)
	.put(
		"/",
		async ({ body }) => {
			try {
				await db.collection("settings").doc("structure").set(body);

				return {
					success: true,
					message: "Struktur organisasi berhasil diperbarui",
				};
			} catch (e: any) {
				return {
					success: false,
					message: `Gagal memperbarui struktur: ${e.message}`,
				};
			}
		},
		{
			body: structureSchema,
		},
	);
