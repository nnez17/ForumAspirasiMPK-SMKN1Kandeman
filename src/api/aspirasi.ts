import Elysia from "elysia";
import { sheets } from "@/lib/google";
import admin from "./middleware/admin";

export default new Elysia({
	prefix: "/aspirasi",
	detail: {
		tags: ["Aspirasi"],
		security: [
			{
				"x-api-key": [],
			},
		],
	},
})
	.use(admin)
	.get("/", async () => {
		const result = await sheets.spreadsheets.values.get({
			spreadsheetId: "1ef9jf0dsJMIPVHouGG-DGKOKY26YqB1NJ0MSRy033bY",
			range: "A2:G",
		});
		return {
			success: true,
			message: "Data aspirasi berhasil diambil",
			data: result.data.values?.map((item) => ({
				email: item[1],
				name: item[2],
				class: item[3],
				status: item[4],
				content: item[5],
				proof: item[6],
				timestamp: item[0],
			})),
		};
	})
	.get("/stats", async () => {
		const result = await sheets.spreadsheets.values.get({
			spreadsheetId: "1ef9jf0dsJMIPVHouGG-DGKOKY26YqB1NJ0MSRy033bY",
			range: "A2:G",
		});
		return {
			success: true,
			message: "Stats aspirasi berhasil diambil",
			data: {
				total: result.data.values?.length || 0,
				info:
					result.data.values?.filter(
						(item) =>
							item[4] === "Informasi/Saran (Hanya laporan perkembangan)",
					).length || 0,
				mid:
					result.data.values?.filter(
						(item) => item[4] === "Sedang (Perlu tindak lanjut rutin)",
					).length || 0,
				urgent:
					result.data.values?.filter(
						(item) => item[4] === "Darurat/Mendesak (Butuh penanganan segera)",
					).length || 0,
			},
		};
	});
