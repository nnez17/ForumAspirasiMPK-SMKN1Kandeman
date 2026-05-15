export interface Person {
	role: string;
	name: string;
	class: string;
	description: string;
	image: string;
	color: string;
}

export interface BPH {
	leader: Person;
	assistants: Person[];
	administration: Person[];
}

const overlayColor = "from-blue-500 to-indigo-600";

export const leader: Person = {
	role: "KETUA UMUM",
	name: "Dyzza Evan Favian",
	class: "XI TITL 1",
	description:
		"Menjadi penanggung jawab utama dalam organisasi, Ketua Umum menghandle dan mengontrol jalannya organisasi MPK.",
	image: "/images/kedua-umum.webp",
	color: overlayColor,
};

export const assistants: Person[] = [
	{
		role: "KETUA 1",
		name: "Deswita Mahrifiani",
		class: "XI RPL 2",
		description:
			"Mengawasi kinerja bendahara dan sekretaris serta menggantikan peran Ketua Umum jika berhalangan hadir.",
		image: "/images/ketua-1.webp",
		color: overlayColor,
	},
	{
		role: "KETUA 2",
		name: "Ade Bramantiyo",
		class: "XI TP 1",
		description:
			"Mengawasi kinerja seluruh Komisi di MPK dan membantu Ketua Umum mengontrol seluruh komisi.",
		image: "/images/ketua-2.webp",
		color: overlayColor,
	},
];

export const administration: Person[] = [
	{
		role: "SEKRETARIS",
		name: "Pramudya Almasdhita Rheiza",
		class: "X PPLG 2",
		description:
			"Bertugas membuat surat undangan rapat, persuratan, proposal, serta mencatat notulen.",
		image: "/images/seketaris.webp",
		color: overlayColor,
	},
	{
		role: "BENDAHARA UMUM",
		name: "Afiq Nafa Aqila",
		class: "XI RPL 1",
		description:
			"Bertugas mengumpulkan dan menyimpan uang kas, serta mencatat seluruh pengeluaran uang kas.",
		image: "/images/bendahara-umum.webp",
		color: overlayColor,
	},
	{
		role: "BENDAHARA",
		name: "Faizatun Hasanah",
		class: "X TE 2",
		description:
			"Membantu bendahara umum dalam mengelola keuangan dan administrasi kas anggota.",
		image: "/images/bendahara.webp",
		color: overlayColor,
	},
];
