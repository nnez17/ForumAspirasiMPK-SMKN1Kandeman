import { Lightbulb, Megaphone, Share2, Users } from "@lucide/astro";
import type { LucideIcon } from "@lucide/svelte";

interface Person {
	id: string;
	title: string;
	subtitle: string;
	fullName: string;
	description: string;
	icon: LucideIcon;
	image: string;
	coordinator: {
		name: string;
		class: string;
	};
	members: string[];
	color: string;
}
export const commissions: Person[] = [
	{
		id: "A",
		title: "KOMISI A",
		subtitle: "Litbang",
		fullName: "Penelitian dan Pengembangan",
		description:
			"Mengembangkan inovasi dan mengevaluasi untuk meningkatkan kinerja tiap anggota serta keberlanjutan organisasi secara menyeluruh.",
		icon: Lightbulb,
		image: "/images/komisi-a.webp",
		coordinator: {
			name: "Muhamad Hafidz Ramdhani",
			class: "X TO 2",
		},
		members: [
			"Luqmanul Hakim (XI TKR 2)",
			"Novita Nanda Juliatun (XI TAV 1)",
			"Muhamad Facri Aqbar (X TKL 1)",
			"Habibburachman Sachputra (X TO 4)",
		],
		color: "from-blue-600/50",
	},
	{
		id: "B",
		title: "KOMISI B",
		subtitle: "KESISWAAN",
		fullName: "Pengawasan & Aspirasi",
		description:
			"Mengawasi setiap ekstrakulikuler di SMK Negeri 1 Kandeman serta mengelola aspirasi warga sekolah demi terciptanya lingkungan yang harmonis.",
		icon: Users,
		image: "/images/komisi-b.webp",
		coordinator: {
			name: "Leny Khoirina",
			class: "X PPLG 1",
		},
		members: [
			"Fahni Hasbirotun (XI TP 2)",
			"Cahya Adinda (XI TSM 2)",
			"Isna Nailis Suroya (X TKL 2)",
			"Silvia Apriliani (X TE 3)",
			"Muhammad Wahyu Sandi (X TO 5)",
		],
		color: "from-amber-600/50",
	},
	{
		id: "C",
		title: "KOMISI C",
		subtitle: "HUMAS",
		fullName: "Hubungan Masyarakat",
		description:
			"Menyampaikan informasi penting, menjadi penghubung warga sekolah, serta mengevaluasi laporan pertanggungjawaban organisasi.",
		icon: Megaphone,
		image: "/images/komisi-c.webp",
		coordinator: {
			name: "Muhammad Arya Ibrahim",
			class: "X TO 3",
		},
		members: [
			"Pulung Pengkuh Legowo (XI TITL 2)",
			"Muhammad Fadli Arsyadhani (XI TSM 1)",
			"Tiara Rahmadhani (XI TEI 1)",
			"Lusi Asmarani (XI TKR 3)",
			"Devi Aulia Putri (X TE 1)",
			"Dimas Slamet Saputra (X TM 1)",
		],
		color: "from-emerald-600/50",
	},
	{
		id: "D",
		title: "KOMISI D",
		subtitle: "MEDKOMINFO",
		fullName: "Media & Komunikasi",
		description:
			"Mengelola media sosial, mendokumentasikan setiap kegiatan, serta menyebarkan informasi inspiratif kepada seluruh warga sekolah.",
		icon: Share2,
		image: "/images/komisi-d.webp",
		coordinator: {
			name: "Egi Ardana",
			class: "X TO 1",
		},
		members: [
			"Ilma Mufida (XI TAV 2)",
			"Wasis Falakhudin (XI TEI 2)",
			"Tetian Virgiani (X TE 4)",
			"Royyan Dhillil Iman (X TM 2)",
		],
		color: "from-rose-600/50",
	},
];
