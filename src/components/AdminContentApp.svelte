<script lang="ts">
import ChevronRight from "@lucide/svelte/icons/chevron-right";
import Edit from "@lucide/svelte/icons/edit";
import Loader2 from "@lucide/svelte/icons/loader-2";
import LogOut from "@lucide/svelte/icons/log-out";
import MessageSquare from "@lucide/svelte/icons/message-square";
import Newspaper from "@lucide/svelte/icons/newspaper";
import Plus from "@lucide/svelte/icons/plus";
import Save from "@lucide/svelte/icons/save";
import ShieldCheck from "@lucide/svelte/icons/shield-check";
import Trash2 from "@lucide/svelte/icons/trash-2";
import X from "@lucide/svelte/icons/x";
import { onMount } from "svelte";
import { flip } from "svelte/animate";

import * as Alert from "@/components/ui/alert/index.js";
import { api } from "@/lib/eden";

// Auth State
let isAuthenticated = $state(false);
let passwordInput = $state("");
let isLoggingIn = $state(false);
let apiKey = $state("");

// Toast System
let toastAlerts = $state<
	{
		id: number;
		variant: "default" | "destructive";
		title: string;
		description: string;
	}[]
>([]);
let toastId = 0;

function addToast(
	title: string,
	description: string,
	variant: "default" | "destructive" = "default",
) {
	const id = toastId++;
	toastAlerts = [...toastAlerts, { id, title, description, variant }];
	setTimeout(() => {
		toastAlerts = toastAlerts.filter((t) => t.id !== id);
	}, 5000);
}

// UI State
let activeSection = $state("publish-content");
let isLoadingData = $state(false);
let isSubmitting = $state(false);
let kategori = $state("berita");
let editingId = $state<string | null>(null);
let imagePreview = $state("");

// Data State
let aspirations: any[] = $state([]);
let newsList: any[] = $state([]);

// Form State
let form = $state({
	title: "",
	excerpt: "",
	content: "",
	author: "",
	category: "Berita",
	image: "",
});

onMount(() => {
	const savedKey = localStorage.getItem("admin_xkey");
	if (savedKey) {
		apiKey = savedKey;
		isAuthenticated = true;
		fetchData();
	}

	const sections = document.querySelectorAll("section[id]");
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					activeSection = entry.target.id;
				}
			}
		},
		{ rootMargin: "-30% 0px -60% 0px" },
	);

	for (const section of sections) {
		observer.observe(section);
	}

	return () => observer.disconnect();
});

async function handleLogin(e: Event) {
	e.preventDefault();
	isLoggingIn = true;

	try {
		const { data, error } = await api.key.get({
			query: { secret: passwordInput },
		});

		if (error || !data || !data.success || !("key" in data)) {
			addToast(
				"Gagal Masuk",
				(data as any)?.message || "Password salah atau akses ditolak.",
				"destructive",
			);
			isLoggingIn = false;
			return;
		}

		apiKey = data.key as string;
		localStorage.setItem("admin_xkey", apiKey);
		localStorage.setItem("admin_authenticated", "true");
		isAuthenticated = true;
		addToast("Berhasil", "Selamat datang kembali, Admin.");
		fetchData();
	} catch (err) {
		addToast("Error", "Terjadi kesalahan koneksi.", "destructive");
	} finally {
		isLoggingIn = false;
	}
}

function handleLogout() {
	localStorage.removeItem("admin_xkey");
	localStorage.removeItem("admin_authenticated");
	isAuthenticated = false;
	apiKey = "";
	passwordInput = "";
}

async function fetchData() {
	isLoadingData = true;
	try {
		// Fetch Aspirations
		const aspRes = await api.aspirasi.get({
			headers: { "x-api-key": apiKey },
		});
		if (aspRes.data && "data" in aspRes.data && aspRes.data.data) {
			aspirations = aspRes.data.data;
		}

		// Fetch News
		const newsRes = await api.news.get();
		if (newsRes.data && "data" in newsRes.data && newsRes.data.data) {
			newsList = newsRes.data.data;
		}
	} catch (err) {
		console.error("Failed to fetch data:", err);
	} finally {
		isLoadingData = false;
	}
}

async function handlePublish(e: Event) {
	e.preventDefault();
	isSubmitting = true;

	try {
		const payload = {
			title: form.title,
			author: form.author,
			excerpt: form.excerpt,
			category: kategori,
			content: form.content,
			image: form.image,
		};

		if (editingId) {
			const { data, error } = await api.news({ id: editingId }).put(payload, {
				headers: { "x-api-key": apiKey },
			});
			if (error || !data || !data.success)
				throw new Error("Gagal memperbarui konten.");
			addToast("Berhasil", "Konten berhasil diperbarui!");
		} else {
			const { data, error } = await api.news.post(payload, {
				headers: { "x-api-key": apiKey },
			});
			if (error || !data || !data.success)
				throw new Error("Gagal mempublikasikan konten.");
			addToast("Berhasil", "Konten berhasil dipublikasikan!");
		}
		// Reset form
		form = {
			title: "",
			excerpt: "",
			content: "",
			author: "",
			category: "Berita",
			image: "",
		};
		editingId = null;
		imagePreview = "";
		fetchData();
	} catch (err: any) {
		addToast(
			"Error",
			err.message || "Terjadi kesalahan sistem.",
			"destructive",
		);
	} finally {
		isSubmitting = false;
	}
}

async function handleFileChange(e: Event) {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = (e) => {
		const base64 = e.target?.result as string;
		imagePreview = base64;
		form.image = base64;
	};
	reader.readAsDataURL(file);
}

function handleEditNews(news: any) {
	editingId = news.id;
	form = {
		title: news.title,
		excerpt: news.excerpt || "",
		content: news.content || "",
		author: news.author || "",
		category: news.category || "berita",
		image: news.image || "",
	};
	kategori =
		news.category?.toLowerCase() === "berita" ||
		news.category?.toLowerCase() === "article"
			? "berita"
			: "info";
	imagePreview = news.image || "";

	const formSection = document.getElementById("publish-content");
	formSection?.scrollIntoView({ behavior: "smooth" });
}

function cancelEdit() {
	editingId = null;
	imagePreview = "";
	form = {
		title: "",
		excerpt: "",
		content: "",
		author: "",
		category: "berita",
		image: "",
	};
}

async function deleteNews(id: string) {
	if (!confirm("Yakin ingin menghapus berita ini?")) return;

	try {
		const { data } = await api.news({ id }).delete(null, {
			headers: { "x-api-key": apiKey },
		});

		if (data?.success) {
			addToast("Berhasil", "Konten berhasil dihapus.");
			fetchData();
		} else {
			addToast("Error", "Gagal menghapus konten.", "destructive");
		}
	} catch (err) {
		addToast("Error", "Terjadi kesalahan saat menghapus.", "destructive");
	}
}
</script>

<!-- Toast Container -->
<div class="fixed top-24 right-6 z-100 w-full max-w-sm space-y-3 pointer-events-none">
	{#each toastAlerts as alert (alert.id)}
		<div animate:flip={{ duration: 300 }} class="pointer-events-auto">
			<Alert.Root variant={alert.variant} class="shadow-2xl border-none backdrop-blur-md bg-background/95 ring-1 ring-border relative group">
				<Alert.Title class="font-black uppercase tracking-widest text-[10px] flex items-center justify-between">
					{alert.title}
					<button 
						onclick={() => toastAlerts = toastAlerts.filter(t => t.id !== alert.id)}
						class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-md"
					>
						<X class="w-3 h-3" />
					</button>
				</Alert.Title>
				<Alert.Description class="font-medium text-xs pr-4">{alert.description}</Alert.Description>
			</Alert.Root>
		</div>
	{/each}
</div>

{#if !isAuthenticated}
	<div class="min-h-screen flex flex-col items-center justify-center bg-background px-4">
		<div class="w-full max-w-md mb-24 space-y-8">
			<div class="text-center space-y-2">
				<img src="/images/logo-mpk.webp" alt="Logo" class="w-32 h-32 mx-auto mb-8" />
				<h1 class="text-4xl font-black tracking-tight text-foreground">Admin Access</h1>
				<p class="text-muted-foreground">Otorisasi diperlukan untuk masuk ke dalam sistem.</p>
			</div>


			<form onsubmit={handleLogin} class="space-y-4">
				<input
					type="password"
					bind:value={passwordInput}
					placeholder="Masukkan Password..."
					class="w-full px-5 py-4 rounded-xl bg-muted border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground font-medium text-center text-lg"
					required
					disabled={isLoggingIn}
				/>
				<button
					type="submit"
					class="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2"
					disabled={isLoggingIn}
				>
					{#if isLoggingIn}
						<Loader2 class="w-6 h-6 animate-spin" />
						Memeriksa...
					{:else}
						Masuk
					{/if}
				</button>
			</form>
		</div>
	</div>
{:else}
	<main class="min-h-screen bg-background pt-28 pb-20">
		<div class="container mx-auto px-4 max-w-6xl">
			<div class="border-b border-border pb-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div>
					<div class="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
						<ShieldCheck class="w-4 h-4" />
						Administrator Panel
					</div>
					<h1 class="text-4xl md:text-5xl font-black text-foreground tracking-tight">
						Kelola <span class="text-primary">Konten</span>
					</h1>
				</div>
				<button
					onclick={handleLogout}
					class="flex items-center gap-2 text-destructive hover:bg-destructive/10 px-4 py-2 rounded-lg transition-colors font-bold text-sm"
				>
					<LogOut class="w-4 h-4" />
					Logout
				</button>
			</div>

			<div class="flex flex-col lg:flex-row gap-12">
				<div class="w-full lg:w-64 shrink-0">
					<nav class="sticky top-28 space-y-2">
						<a
							href="#publish-content"
							class={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all no-underline ${activeSection === "publish-content" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
						>
							<Newspaper class="w-5 h-5" />
							Publish Konten
						</a>
						<a
							href="#manage-news"
							class={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all no-underline ${activeSection === "manage-news" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
						>
							<Edit class="w-5 h-5" />
							Daftar Berita
						</a>
						<a
							href="#aspirasi"
							class={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all no-underline ${activeSection === "aspirasi" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
						>
							<MessageSquare class="w-5 h-5" />
							Aspirasi Siswa
						</a>
					</nav>
				</div>

				<div class="flex-1 space-y-20">
					<!-- Publish Konten -->
                    <section id="publish-content" class="scroll-mt-32">
                        <div class="mb-8">
                            <h2 class="text-2xl font-black text-foreground flex items-center gap-2">
                                <Plus class="w-6 h-6 text-primary" />
                                {editingId ? 'Edit Konten' : 'Form Publikasi'}
                        </h2>
                        <p class="text-muted-foreground mt-1">
                            {editingId ? 'Perbarui informasi yang sudah ada.' : 'Tambahkan berita atau informasi penting untuk halaman utama.'}
                        </p>
                    </div>


                    <form onsubmit={handlePublish} class="space-y-6 max-w-3xl">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2 md:col-span-2">
                                <label for="kategori" class="text-sm font-bold text-foreground">Kategori Konten</label>
                                <div class="relative">
                                    <select bind:value={kategori} class="w-full px-5 py-3 rounded-xl bg-muted border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-foreground appearance-none">
                                        <option value="berita">BERITA</option>
                                        <option value="info">INFO PENTING</option>
                                    </select>
                                    <ChevronRight class="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
                                </div>
                            </div>

                            <div class="space-y-2 md:col-span-2">
                                <label for="judul" class="text-sm font-bold text-foreground">Judul</label>
                                <input id="judul" type="text" bind:value={form.title} placeholder="Masukkan judul..." class="w-full px-5 py-3 rounded-xl bg-muted border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-foreground" required />
                            </div>

                            {#if kategori === 'berita'}
                                <div class="space-y-2 md:col-span-2">
                                    <label for="ringkasan" class="text-sm font-bold text-foreground">Isi Berita</label>
                                    <textarea id="ringkasan" rows="4" bind:value={form.excerpt} placeholder="Tulis isi berita..." class="w-full px-5 py-3 rounded-xl bg-muted border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-foreground" required></textarea>
                                </div>

                                <div class="space-y-2 md:col-span-2">
                                    <label for="penulis" class="text-sm font-bold text-foreground">Nama Penulis</label>
                                    <input id="penulis" type="text" bind:value={form.author} placeholder="Misal: Admin MPK" class="w-full px-5 py-3 rounded-xl bg-muted border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-foreground" required />
                                </div>

                                <div class="space-y-2 md:col-span-2">
                                    <label for="foto" class="text-sm font-bold text-foreground">Foto Berita</label>
                                    <div class="flex flex-col md:flex-row gap-4 items-start">
                                        {#if imagePreview}
                                            <div class="relative group w-full md:w-48 h-32 rounded-xl overflow-hidden border-2 border-primary/20">
                                                <img src={imagePreview} alt="Preview" class="w-full h-full object-cover" />
                                                <button 
                                                    type="button"
                                                    onclick={() => { imagePreview = ""; form.image = ""; }}
                                                    class="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 class="w-4 h-4" />
                                                </button>
                                            </div>
                                        {/if}
                                        <div class="flex-1 w-full">
                                            <input 
                                                id="foto" 
                                                type="file" 
                                                accept="image/*" 
                                                onchange={handleFileChange}
                                                class="w-full px-5 py-2.5 rounded-xl bg-muted border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer" 
                                            />
                                            <p class="text-[10px] text-muted-foreground mt-2 font-medium italic">Format: JPG, PNG, WEBP. Maks 10MB.</p>
                                        </div>
                                    </div>
                                </div>
                                {/if}
                            </div>

                            <div class="pt-4 flex gap-3">
                                <button type="submit" class="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2" disabled={isSubmitting}>
                                    {#if isSubmitting}
                                        <Loader2 class="w-5 h-5 animate-spin" />
                                        Sedang Memproses...
                                    {:else}
                                        <Save class="w-5 h-5" />
                                        {editingId ? 'Simpan Perubahan' : 'Publish Sekarang'}
                                    {/if}
                                </button>

                                {#if editingId}
                                    <button 
                                        type="button" 
                                        onclick={cancelEdit}
                                        class="px-8 py-3 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-all"
                                    >
                                        Batal
                                    </button>
                                {/if}
                            </div>
                        </form>
                    </section>

					<!-- Manage News -->
					<section id="manage-news" class="scroll-mt-32">
						<div class="mb-8">
							<h2 class="text-2xl font-black text-foreground flex items-center gap-2">
								<Newspaper class="w-6 h-6 text-primary" />
								Daftar Berita
							</h2>
							<p class="text-muted-foreground mt-1">Kelola berita yang sudah dipublikasikan.</p>
						</div>

						{#if isLoadingData}
							<div class="flex flex-col items-center justify-center py-10">
								<Loader2 class="w-8 h-8 animate-spin text-primary" />
							</div>
						{:else}
							<div class="overflow-x-auto">
								<table class="w-full text-left border-collapse">
									<thead>
										<tr class="border-b-2 border-border">
											<th class="py-4 pr-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Judul</th>
											<th class="py-4 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Tanggal</th>
											<th class="py-4 pl-4 text-xs font-black text-muted-foreground uppercase tracking-widest text-right">Aksi</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-border">
										{#each newsList as news}
											<tr class="hover:bg-muted/50 transition-colors group">
												<td class="py-4 pr-4">
													<div class="font-bold text-foreground line-clamp-1">{news.title}</div>
												</td>
												<td class="py-4 px-4 text-sm text-muted-foreground">{news.date}</td>
												<td class="py-4 pl-4 text-right">
													<div class="flex items-center justify-end gap-2">
														<button
															onclick={() => handleEditNews(news)}
															class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
															title="Edit"
														>
															<Edit class="w-4 h-4" />
														</button>
														<button
															onclick={() => deleteNews(news.id)}
															class="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
															title="Hapus"
														>
															<Trash2 class="w-4 h-4" />
														</button>
													</div>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</section>

					<!-- Aspirasi -->
					<section id="aspirasi" class="scroll-mt-32">
						<div class="mb-8">
							<h2 class="text-2xl font-black text-foreground flex items-center gap-2">
								<MessageSquare class="w-6 h-6 text-primary" />
								Aspirasi Masuk
							</h2>
							<p class="text-muted-foreground mt-1">Daftar aspirasi dari siswa yang perlu ditinjau.</p>
						</div>

						{#if isLoadingData}
							<div class="flex flex-col items-center justify-center py-20 space-y-4">
								<Loader2 class="w-10 h-10 animate-spin text-primary" />
								<p class="font-bold text-muted-foreground">Memuat data aspirasi...</p>
							</div>
						{:else}
							<div class="overflow-x-auto">
								<table class="w-full text-left border-collapse">
									<thead>
										<tr class="border-b-2 border-border">
											<th class="py-4 pr-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Siswa</th>
											<th class="py-4 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Pesan</th>
											<th class="py-4 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest text-right">Status</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-border">
										{#each aspirations as item}
											<tr class="hover:bg-muted/50 transition-colors group">
												<td class="py-4 pr-4">
													<div class="font-bold text-foreground whitespace-nowrap">{item.name}</div>
													<div class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
														{item.class}
													</div>
												</td>
												<td class="py-4 px-4 text-sm text-muted-foreground max-w-[200px] md:max-w-[300px]">
													<p class="truncate">{item.content}</p>
												</td>
												<td class="py-4 px-4 text-right">
													<span
														class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap 
														{item.status?.includes('Darurat') ? 'bg-red-500/10 text-red-600' : 
														 item.status?.includes('Sedang') ? 'bg-amber-500/10 text-amber-600' : 
														 item.status?.includes('Informasi') ? 'bg-blue-500/10 text-blue-600' : 
														 'bg-muted text-muted-foreground'}"
													>
														<span class="w-1.5 h-1.5 rounded-full bg-current"></span>
														{item.status?.split(' ')[0] || "Pending"}
													</span>
												</td>
											</tr>
										{/each}

										{#if aspirations.length === 0}
											<tr>
												<td colspan="4" class="text-center py-8 text-muted-foreground font-medium"> Belum ada aspirasi yang masuk. </td>
											</tr>
										{/if}
									</tbody>
								</table>
							</div>
						{/if}
					</section>
				</div>
			</div>
		</div>
	</main>
{/if}
