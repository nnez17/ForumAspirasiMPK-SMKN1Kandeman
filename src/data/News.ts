export interface NewsItem {
	id: string;
	title: string;
	date: string;
	author: string;
	excerpt: string;
	image: string;
	category: string;
	link: string;
}

export const newsData: NewsItem[] = [
	{
		id: "1",
		title: "BACKEND NGOK ",
		date: "Februari 22, 2025",
		author: "ARYA",
		excerpt: "AA",
		image: "",
		category: "BERITA",
		link: "#",
	},
	{
		id: "2",
		title: "FRONTEND NGOK",
		date: "Februari 22, 2025",
		author: "NNEZ",
		excerpt: "AA",
		image: "",
		category: "BERITA",
		link: "#",
	},
];
