<script lang="ts">
import Bold from "@lucide/svelte/icons/bold";
import ChevronRight from "@lucide/svelte/icons/chevron-right";
import Edit from "@lucide/svelte/icons/edit";
import Eye from "@lucide/svelte/icons/eye";
import Heading from "@lucide/svelte/icons/heading";
import Italic from "@lucide/svelte/icons/italic";
import LinkIcon from "@lucide/svelte/icons/link";
import List from "@lucide/svelte/icons/list";
import Loader2 from "@lucide/svelte/icons/loader-2";
import LogOut from "@lucide/svelte/icons/log-out";
import MessageSquare from "@lucide/svelte/icons/message-square";
import Newspaper from "@lucide/svelte/icons/newspaper";
import Plus from "@lucide/svelte/icons/plus";
import Save from "@lucide/svelte/icons/save";
import ShieldCheck from "@lucide/svelte/icons/shield-check";
import Trash2 from "@lucide/svelte/icons/trash-2";
import Type from "@lucide/svelte/icons/type";
import X from "@lucide/svelte/icons/x";
import { upload } from "@vercel/blob/client";
import { marked } from "marked";
import { onMount } from "svelte";
import { flip } from "svelte/animate";
import * as Alert from "@/components/ui/alert/index.js";
import { api } from "@/lib/eden";
import * as AlertDialog from "@/components/ui/alert-dialog/index.ts";

// Auth State
let isAuthenticated = $state(false);
let passwordInput = $state("");
let isLoggingIn = $state(false);
let apiKey = $state("");
let isDeleteDialogOpen = $state(false);
let newsToDeleteId = $state<string | null>(null);

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

function getImageUrl(image: string) {
	if (!image) return "";
	if (image.startsWith("http") || image.startsWith("/")) return image;
	return `/i/${image}`;
}

// UI State
let activeSection = $state("publish-content");
let isLoadingData = $state(false);
let isSubmitting = $state(false);
let kategori = $state("berita");
let editingId = $state<string | null>(null);
let imagePreview = $state("");
let selectedFile = $state<File | null>(null);
let isPreviewMode = $state(false);

// Data State
let aspirations: any[] = $state([]);
let newsList: any[] = $state([]);

// Form State
let form = $state({
	title: "",
	excerpt: "",
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
});

async function handleLogin(e: Event) {
	e.preventDefault();
	isLoggingIn = true;

	try {
		const { data, error } = await api.misc.keys.get({
			query: { secret: passwordInput },
		});

		if (error || !data || !data.success || !data.data?.key) {
			addToast(
				"Gagal Masuk",
				"Password salah. Silahkan coba lagi.",
				"destructive",
			);
			isLoggingIn = false;
			return;
		}

		apiKey = data.data.key;
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

function applyShortcut(type: "bold" | "italic" | "link" | "list" | "heading") {
	const textarea = document.getElementById("konten") as HTMLTextAreaElement;
	if (!textarea) return;

	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const text = textarea.value;
	const selectedText = text.substring(start, end);

	let replacement = "";
	let cursorOffset = 0;
	let selectionLength = selectedText.length;
	let newStart = start;
	let newEnd = end;

	const toggleWrapper = (prefix: string, suffix: string) => {
		// Case 1: Selection is already wrapped: [**text**]
		if (selectedText.startsWith(prefix) && selectedText.endsWith(suffix)) {
			replacement = selectedText.slice(prefix.length, -suffix.length);
			cursorOffset = 0;
			selectionLength = replacement.length;
			return true;
		}
		// Case 2: Cursor/Selection is inside a wrapper: **[text]**
		if (
			text.slice(start - prefix.length, start) === prefix &&
			text.slice(end, end + suffix.length) === suffix
		) {
			newStart = start - prefix.length;
			newEnd = end + suffix.length;
			replacement = selectedText;
			cursorOffset = 0;
			selectionLength = selectedText.length;
			return true;
		}
		return false;
	};

	let isToggled = false;
	switch (type) {
		case "bold":
			isToggled = toggleWrapper("**", "**");
			if (!isToggled) {
				replacement = `**${selectedText}**`;
				cursorOffset = 2;
			}
			break;
		case "italic":
			isToggled = toggleWrapper("*", "*");
			if (!isToggled) {
				replacement = `*${selectedText}*`;
				cursorOffset = 1;
			}
			break;
		case "link":
			isToggled = toggleWrapper("[", "](https://)");
			if (!isToggled) {
				replacement = `[${selectedText || "Link Text"}](https://)`;
				cursorOffset = 1;
				selectionLength = selectedText.length || 9;
			}
			break;
		case "list":
			if (selectedText.startsWith("- ")) {
				replacement = selectedText.slice(2);
				cursorOffset = 0;
				selectionLength = replacement.length;
			} else {
				replacement = `- ${selectedText}`;
				cursorOffset = 2;
			}
			break;
		case "heading":
			if (selectedText.startsWith("## ")) {
				replacement = selectedText.slice(3);
				cursorOffset = 0;
				selectionLength = replacement.length;
			} else {
				replacement = `## ${selectedText}`;
				cursorOffset = 3;
			}
			break;
	}

	const newText =
		text.substring(0, newStart) + replacement + text.substring(newEnd);
	form.excerpt = newText;

	setTimeout(() => {
		textarea.focus();
		const finalStart = newStart + cursorOffset;
		textarea.setSelectionRange(finalStart, finalStart + selectionLength);
	}, 0);
}

function handleKeydown(e: KeyboardEvent) {
	if (e.ctrlKey || e.metaKey) {
		switch (e.key.toLowerCase()) {
			case "b":
				e.preventDefault();
				applyShortcut("bold");
				break;
			case "i":
				e.preventDefault();
				applyShortcut("italic");
				break;
			case "k":
				e.preventDefault();
				applyShortcut("link");
				break;
		}
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
			image: form.image,
		};

		if (selectedFile) {
			const fileExtension = selectedFile.name.split(".").pop();
			const uuid = crypto.randomUUID();
			const fileName = `${uuid}.${fileExtension}`;

			await upload(`images/${fileName}`, selectedFile, {
				access: "public",
				handleUploadUrl: "/api/misc/upload",
				headers: { "x-api-key": apiKey },
			});
			payload.image = fileName;
		}

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
			author: "",
			category: "Berita",
			image: "",
		};
		editingId = null;
		imagePreview = "";
		selectedFile = null;
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

	selectedFile = file;
	imagePreview = URL.createObjectURL(file);
}

function handleEditNews(news: any) {
	editingId = news.id;
	form = {
		title: news.title,
		excerpt: news.excerpt || "",
		author: news.author || "",
		category: news.category || "berita",
		image: news.image || "",
	};
	kategori =
		news.category?.toLowerCase() === "berita" ||
		news.category?.toLowerCase() === "article"
			? "berita"
			: "info";
	imagePreview = getImageUrl(news.image);

	activeSection = "publish-content";
	setTimeout(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, 0);
}

function cancelEdit() {
	activeSection = "manage-news";
	editingId = null;
	imagePreview = "";
	form = {
		title: "",
		excerpt: "",
		author: "",
		category: "berita",
		image: "",
	};
	selectedFile = null;
	setTimeout(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, 0);
}

function confirmDelete(id: string) {
	newsToDeleteId = id;
	isDeleteDialogOpen = true;
}

async function deleteNews() {
	if (!newsToDeleteId) return;
	const id = newsToDeleteId;

	try {
		const newsItem = newsList.find((n) => n.id === id);

		const { data } = await api.news({ id }).delete(null, {
			headers: { "x-api-key": apiKey },
		});

		if (data?.success) {
			if (newsItem?.image) {
				const imagePath = newsItem.image.startsWith("/api/misc/images/")
					? newsItem.image.replace("/api/misc/images/", "")
					: newsItem.image.startsWith("/i/")
						? newsItem.image.replace("/i/", "")
						: newsItem.image;

				// @ts-expect-error this work perfectly fine, idk why eden keeps complaining
				await api.misc.images({ "*": imagePath }).delete(null, {
					headers: { "x-api-key": apiKey },
				});
			}

			addToast("Berhasil", "Konten berhasil dihapus.");
			fetchData();
		} else {
			addToast("Error", "Gagal menghapus konten.", "destructive");
		}
	} catch (err) {
		addToast("Error", "Terjadi kesalahan saat menghapus.", "destructive");
	} finally {
		isDeleteDialogOpen = false;
		newsToDeleteId = null;
	}
}
</script>

<!-- Toast Container -->
<div class="fixed top-20 left-4 right-4 md:top-24 md:left-auto md:right-6 z-100 w-[calc(100%-2rem)] md:w-full md:max-w-sm space-y-3 pointer-events-none mx-auto md:mx-0">
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
					<h1 class="text-3xl md:text-5xl font-black text-foreground tracking-tight">
						Kelola <span class="text-primary">Konten</span>
					</h1>
				</div>
				<button
					onclick={handleLogout}
					class="flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 bg-destructive/5 md:bg-transparent w-full md:w-auto px-4 py-3 md:py-2 rounded-xl md:rounded-lg transition-colors font-bold text-sm shrink-0"
				>
					<LogOut class="w-4 h-4" />
					Logout
				</button>
			</div>

			<div class="flex flex-col md:flex-row gap-8 md:gap-12">
				<div class="w-full md:w-64 shrink-0">
					<nav class="flex flex-col md:sticky md:top-28 gap-2">
						<button
							onclick={() => activeSection = "publish-content"}
							class={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeSection === "publish-content" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
						>
							<Newspaper class="w-5 h-5" />
							<span>Publish Konten</span>
						</button>
						<button
							onclick={() => activeSection = "manage-news"}
							class={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeSection === "manage-news" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
						>
							<Edit class="w-5 h-5" />
							<span>Daftar Berita</span>
						</button>
						<button
							onclick={() => activeSection = "aspirasi"}
							class={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeSection === "aspirasi" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
						>
							<MessageSquare class="w-5 h-5" />
							<span>Aspirasi Siswa</span>
						</button>
					</nav>
				</div>

				<div class="flex-1">
					{#if activeSection === 'publish-content'}
					<!-- Publish Konten -->
					<section id="publish-content">
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
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                        <label for="konten" class="text-sm font-bold text-foreground">Isi Berita</label>
                        <div class="flex items-center gap-1 bg-muted p-1 rounded-lg overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0">
                            <button type="button" onclick={() => applyShortcut('bold')} class="p-1.5 hover:bg-background rounded-md transition-colors shrink-0" title="Bold (Ctrl+B)"><Bold class="w-3.5 h-3.5" /></button>
                            <button type="button" onclick={() => applyShortcut('italic')} class="p-1.5 hover:bg-background rounded-md transition-colors shrink-0" title="Italic (Ctrl+I)"><Italic class="w-3.5 h-3.5" /></button>
                            <button type="button" onclick={() => applyShortcut('link')} class="p-1.5 hover:bg-background rounded-md transition-colors shrink-0" title="Link (Ctrl+K)"><LinkIcon class="w-3.5 h-3.5" /></button>
                            <button type="button" onclick={() => applyShortcut('list')} class="p-1.5 hover:bg-background rounded-md transition-colors shrink-0" title="List"><List class="w-3.5 h-3.5" /></button>
                            <button type="button" onclick={() => applyShortcut('heading')} class="p-1.5 hover:bg-background rounded-md transition-colors shrink-0" title="Heading"><Heading class="w-3.5 h-3.5" /></button>
                            <div class="w-px h-4 bg-border mx-1 shrink-0"></div>
                            <button 
                                type="button" 
                                onclick={() => isPreviewMode = !isPreviewMode} 
                                class={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all text-[10px] font-black uppercase tracking-wider shrink-0 ${isPreviewMode ? 'bg-primary text-primary-foreground' : 'hover:bg-background text-muted-foreground'}`}
                            >
                                {#if isPreviewMode}
                                    <Type class="w-3 h-3" /> Editor
                                {:else}
                                    <Eye class="w-3 h-3" /> Preview
                                {/if}
                            </button>
                        </div>
                    </div>

                {#if isPreviewMode}
                    <div class="w-full px-6 py-6 rounded-xl bg-muted/50 border border-border min-h-[300px] prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                        {@html marked.parse(form.excerpt|| "*Belum ada konten...*")}
                    </div>
                {:else}
                    <textarea 
                        id="konten" 
                        rows="12" 
                        bind:value={form.excerpt} 
                        onkeydown={handleKeydown}
                        placeholder="Tulis konten berita lengkap..." 
                        class="w-full px-5 py-4 rounded-xl bg-muted border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-foreground leading-relaxed" 
                        required
                    ></textarea>
                {/if}
                <p class="text-[10px] text-muted-foreground mt-1 font-medium italic">
                    <a href="https://www.markdownguide.org/" target="_blank" rel="noopener noreferrer" class="underline">Markdown</a> didukung.
                </p>
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
														onclick={() => { imagePreview = ""; form.image = ""; selectedFile = null; }}
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
												<p class="text-[10px] text-muted-foreground mt-2 font-medium italic">Format: JPG, PNG, WEBP, HEIC. Maks 10MB.</p>
											</div>
										</div>
									</div>
								{/if}
							</div>

							<div class="pt-4 flex flex-col sm:flex-row gap-3">
								<button type="submit" class="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2" disabled={isSubmitting}>
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
										class="w-full sm:w-auto px-8 py-3 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-all flex items-center justify-center"
									>
										Batal
									</button>
								{/if}
							</div>
						</form>
					</section>
					{/if}

					{#if activeSection === 'manage-news'}
					<!-- Manage News -->
					<section id="manage-news">
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
											<th class="py-4 pr-4 text-xs font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">Judul</th>
											<th class="py-4 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Kategori</th>
											<th class="py-4 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap hidden md:table-cell">Tanggal</th>
											<th class="py-4 pl-4 text-xs font-black text-muted-foreground uppercase tracking-widest text-right whitespace-nowrap">Aksi</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-border">
										{#each newsList as news}
											<tr class="hover:bg-muted/50 transition-colors group">
												<td class="py-4 pr-4">
													<div class="font-bold text-foreground line-clamp-2 md:line-clamp-1 min-w-[150px]">{news.title}</div>
													<div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 sm:hidden">{news.category} • {news.date}</div>
													<div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 hidden sm:block md:hidden">{news.date}</div>
												</td>
												<td class="py-4 px-4 text-sm text-muted-foreground hidden sm:table-cell">{news.category.toUpperCase()}</td>
												<td class="py-4 px-4 text-sm text-muted-foreground hidden md:table-cell">{news.date}</td>
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
															onclick={() => confirmDelete(news.id)}
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
					{/if}

					{#if activeSection === 'aspirasi'}
					<!-- Aspirasi -->
					<section id="aspirasi">
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
											<th class="py-4 pr-4 text-xs font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">Siswa</th>
											<th class="py-4 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Pesan</th>
											<th class="py-4 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest text-center whitespace-nowrap hidden md:table-cell">Status</th>
											<th class="py-4 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest text-right whitespace-nowrap">Bukti</th>
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
													<div class="mt-2 sm:hidden">
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
													</div>
													<div class="mt-2 text-xs text-muted-foreground sm:hidden line-clamp-2">
														{item.content}
													</div>
												</td>
												<td class="py-4 px-4 text-sm text-muted-foreground max-w-[200px] md:max-w-[300px] hidden sm:table-cell">
													<p class="truncate">{item.content}</p>
													<div class="mt-2 md:hidden">
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
													</div>
												</td>
												<td class="py-4 px-4 text-center hidden md:table-cell">
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
												<td class="py-4 px-4 text-right">
													{#if item.proof}
														<a href={item.proof} target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-bold whitespace-nowrap">
															<LinkIcon class="w-3.5 h-3.5" />
															<span class="hidden sm:inline">Lihat</span>
														</a>
													{:else}
														<span class="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-2 whitespace-nowrap">Tidak Ada</span>
													{/if}
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
					{/if}
				</div>
			</div>
		</div>
	</main>
{/if}

<AlertDialog.Root bind:open={isDeleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Hapus Konten Berita</AlertDialog.Title>
			<AlertDialog.Description>
				Yakin ingin menghapus berita ini?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Batal</AlertDialog.Cancel>
			<AlertDialog.Action onclick={deleteNews} variant="destructive">
				Hapus
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	:global(.prose ul) {
		list-style-type: disc !important;
		list-style-position: outside !important;
		padding-left: 2rem !important;
		margin-top: 0.5rem !important;
		margin-bottom: 0.5rem !important;
	}
	:global(.prose ol) {
		list-style-type: decimal !important;
		list-style-position: outside !important;
		padding-left: 2rem !important;
		margin-top: 0.5rem !important;
		margin-bottom: 0.5rem !important;
	}
	:global(.prose li) {
		margin-bottom: 0.25rem !important;
		display: list-item !important;
	}
	:global(.prose ul ul, .prose ol ol, .prose ul ol, .prose ol ul) {
		margin-top: 0.25rem !important;
		margin-bottom: 0.25rem !important;
		padding-left: 1.5rem !important;
	}
</style>
