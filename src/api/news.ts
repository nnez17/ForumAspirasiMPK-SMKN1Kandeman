import { Elysia, t } from "elysia";
import { db } from "@/lib/firebase";
import admin from "./middleware/admin";

export default new Elysia({
	prefix: "/news",
	detail: {
		tags: ["News"],
	},
})
	.get("/", async () => {
		try {
			const snapshot = await db
				.collection("news")
				.orderBy("createdAt", "desc")
				.get();
			const news = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));

			return {
				success: true,
				message: "Data berita berhasil diambil",
				data: news,
			};
		} catch (e: any) {
			return {
				success: false,
				message: `Gagal mengambil data berita: ${e.message}`,
			};
		}
	})
	.get("/:id", async ({ params: { id } }) => {
		try {
			const doc = await db.collection("news").doc(id).get();
			if (!doc.exists) {
				return {
					success: false,
					message: "Berita tidak ditemukan",
				};
			}

			return {
				success: true,
				message: "Data berita berhasil diambil",
				data: {
					id: doc.id,
					...doc.data(),
				},
			};
		} catch (e: any) {
			return {
				success: false,
				message: `Gagal mengambil data berita: ${e.message}`,
			};
		}
	})

	.use(admin)
	.post(
		"/",
		async ({ body }) => {
			try {
				if (!body.date) body.date = new Date().toDateString();
				if (!body.image) body.image = "";

				const res = await db.collection("news").add({
					...body,
					createdAt: new Date().toISOString(),
				});

				return {
					success: true,
					message: "Berita berhasil ditambahkan",
					data: {
						id: res.id,
					},
				};
			} catch (e: any) {
				return {
					success: false,
					message: `Gagal menambahkan berita: ${e.message}`,
				};
			}
		},
		{
			body: t.Object({
				title: t.String(),
				date: t.Optional(t.String()),
				author: t.String(),
				excerpt: t.String(),
				image: t.Optional(t.String()),
				category: t.String(),
			}),
		},
	)
	.put(
		"/:id",
		async ({ params: { id }, body }) => {
			try {
				const docRef = db.collection("news").doc(id);
				const doc = await docRef.get();

				if (!doc.exists) {
					return {
						success: false,
						message: "Berita tidak ditemukan",
					};
				}

				await docRef.update({
					...body,
					updatedAt: new Date().toISOString(),
				});

				return {
					success: true,
					message: "Berita berhasil diperbarui",
				};
			} catch (e: any) {
				return {
					success: false,
					message: `Gagal memperbarui berita: ${e.message}`,
				};
			}
		},
		{
			body: t.Object({
				title: t.Optional(t.String()),
				date: t.Optional(t.String()),
				author: t.Optional(t.String()),
				excerpt: t.Optional(t.String()),
				image: t.Optional(t.String()),
				category: t.Optional(t.String()),
				link: t.Optional(t.String()),
			}),
		},
	)
	.delete("/:id", async ({ params: { id } }) => {
		try {
			const docRef = db.collection("news").doc(id);
			const doc = await docRef.get();

			if (!doc.exists) {
				return {
					success: false,
					message: "Berita tidak ditemukan",
				};
			}

			await docRef.delete();

			return {
				success: true,
				message: "Berita berhasil dihapus",
			};
		} catch (e: any) {
			return {
				success: false,
				message: `Gagal menghapus berita: ${e.message}`,
			};
		}
	});
