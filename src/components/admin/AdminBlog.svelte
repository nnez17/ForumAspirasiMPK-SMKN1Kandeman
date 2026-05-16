<script lang="ts">
import { onMount } from "svelte";
import Loader2 from "@lucide/svelte/icons/loader-2";
import Newspaper from "@lucide/svelte/icons/newspaper";
import Edit from "@lucide/svelte/icons/edit";
import Trash2 from "@lucide/svelte/icons/trash-2";
import Plus from "@lucide/svelte/icons/plus";
import ChevronRight from "@lucide/svelte/icons/chevron-right";
import Bold from "@lucide/svelte/icons/bold";
import Italic from "@lucide/svelte/icons/italic";
import LucideLink from "@lucide/svelte/icons/link";
import List from "@lucide/svelte/icons/list";
import Heading from "@lucide/svelte/icons/heading";
import Eye from "@lucide/svelte/icons/eye";
import Type from "@lucide/svelte/icons/type";
import Save from "@lucide/svelte/icons/save";
import { marked } from "marked";
import { upload } from "@vercel/blob/client";
import * as Dialog from "@/components/ui/dialog/index.js";
import * as AlertDialog from "@/components/ui/alert-dialog/index.js";
import { api } from "@/lib/eden";
import { adminState, addToast } from "@/lib/adminState.svelte";
import AdminLayout from "./AdminLayout.svelte";
import { getOptimizedImageUrl } from "@/lib/utils";

let newsList: any[] = $state([]);
let isLoadingData = $state(false);
let isSubmitting = $state(false);
let fetched = false;

let isDialogOpen = $state(false);
let isDeleteDialogOpen = $state(false);
let newsToDeleteId = $state<string | null>(null);

// Form State
let editingId = $state<string | null>(null);
let kategori = $state("berita");
let form = $state({
	title: "",
	excerpt: "",
	author: "",
	category: "Berita",
	image: "",
});
let imagePreview = $state("");
let selectedFile = $state<File | null>(null);
let isPreviewMode = $state(false);

onMount(() => {
	if (adminState.apiKey) fetchData();
});

$effect(() => {
	if (adminState.apiKey && !fetched) fetchData();
});

async function fetchData() {
	if (fetched || isLoadingData) return;
	isLoadingData = true;
	fetched = true;
	try {
		const res = await api.news.get();
		if (res.data && "data" in res.data && res.data.data) {
			newsList = res.data.data;
		}
	} catch (err) {
		console.error(err);
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
		if (selectedText.startsWith(prefix) && selectedText.endsWith(suffix)) {
			replacement = selectedText.slice(prefix.length, -suffix.length);
			cursorOffset = 0;
			selectionLength = replacement.length;
			return true;
		}
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

async function handleFileChange(e: Event) {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file) return;

	selectedFile = file;
	imagePreview = URL.createObjectURL(file);
}

function openCreateDialog() {
	editingId = null;
	form = { title: "", excerpt: "", author: "", category: "berita", image: "" };
	kategori = "berita";
	imagePreview = "";
	selectedFile = null;
	isDialogOpen = true;
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
	imagePreview = getOptimizedImageUrl(news.image, 400, 300);
	isDialogOpen = true;
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
				headers: { "x-api-key": adminState.apiKey },
			});
			payload.image = fileName;
		}

		if (editingId) {
			const { data, error } = await api
				.news({ id: editingId })
				.put(payload, { headers: { "x-api-key": adminState.apiKey } });
			if (error || !data || !data.success)
				throw new Error("Gagal memperbarui konten.");
			addToast("Berhasil", "Konten berhasil diperbarui!");
		} else {
			const { data, error } = await api.news.post(payload, {
				headers: { "x-api-key": adminState.apiKey },
			});
			if (error || !data || !data.success)
				throw new Error("Gagal mempublikasikan konten.");
			addToast("Berhasil", "Konten berhasil dipublikasikan!");
		}
		isDialogOpen = false;
		fetched = false; // reset fetch
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

function confirmDelete(id: string) {
	newsToDeleteId = id;
	isDeleteDialogOpen = true;
}

async function deleteNews() {
	if (!newsToDeleteId) return;
	const id = newsToDeleteId;

	try {
		const newsItem = newsList.find((n) => n.id === id);
		const { data } = await api
			.news({ id })
			.delete(null, { headers: { "x-api-key": adminState.apiKey } });

		if (data?.success) {
			if (newsItem?.image) {
				const imagePath = newsItem.image.startsWith("/api/misc/images/")
					? newsItem.image.replace("/api/misc/images/", "")
					: newsItem.image.startsWith("/i/")
						? newsItem.image.replace("/i/", "")
						: newsItem.image;
				await api.misc
					// @ts-expect-error this work perfectly fine
					.images({ "*": imagePath })
					.delete(null, { headers: { "x-api-key": adminState.apiKey } });
			}
			addToast("Berhasil", "Konten berhasil dihapus.");
			fetched = false;
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

<AdminLayout activeSection="blog">
  <div class="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div>
      <h2 class="text-2xl font-black text-foreground flex items-center gap-2">
        <Newspaper class="w-6 h-6 text-primary" />
        Daftar Berita
      </h2>
      <p class="text-muted-foreground mt-1">Kelola berita yang sudah dipublikasikan.</p>
    </div>
    <button
      onclick={openCreateDialog}
      class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all"
    >
      <Plus class="w-4 h-4" />
      Buat Konten
    </button>
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
                    class="w-9 h-9 rounded-xl bg-red-500/5 text-red-600 flex items-center justify-center border border-red-500/10 active:scale-90 transition-all shadow-sm hover:bg-red-500/10"
                    title="Hapus"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
          {#if newsList.length === 0}
            <tr><td colspan="4" class="text-center py-8 text-muted-foreground font-medium"> Belum ada berita. </td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</AdminLayout>

<Dialog.Root bind:open={isDialogOpen}>
  <Dialog.Content class="max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar">
    <Dialog.Header>
      <Dialog.Title>{editingId ? 'Edit Konten' : 'Form Publikasi'}</Dialog.Title>
      <Dialog.Description>
        {editingId ? 'Perbarui informasi yang sudah ada.' : 'Tambahkan berita atau informasi penting untuk halaman utama.'}
      </Dialog.Description>
    </Dialog.Header>
    <form onsubmit={handlePublish} class="space-y-6 mt-4">
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
                <button type="button" onclick={() => applyShortcut('link')} class="p-1.5 hover:bg-background rounded-md transition-colors shrink-0" title="Link (Ctrl+K)"><LucideLink class="w-3.5 h-3.5" /></button>
                <button type="button" onclick={() => applyShortcut('list')} class="p-1.5 hover:bg-background rounded-md transition-colors shrink-0" title="List"><List class="w-3.5 h-3.5" /></button>
                <button type="button" onclick={() => applyShortcut('heading')} class="p-1.5 hover:bg-background rounded-md transition-colors shrink-0" title="Heading"><Heading class="w-3.5 h-3.5" /></button>
                <div class="w-px h-4 bg-border mx-1 shrink-0"></div>
                <button 
                  type="button" 
                  onclick={() => isPreviewMode = !isPreviewMode} 
                  class={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all text-[10px] font-black uppercase tracking-wider shrink-0 ${isPreviewMode ? 'bg-primary text-primary-foreground' : 'hover:bg-background text-muted-foreground'}`}
                >
                  {#if isPreviewMode}<Type class="w-3 h-3" /> Editor{:else}<Eye class="w-3 h-3" /> Preview{/if}
                </button>
              </div>
            </div>

            {#if isPreviewMode}
              <div class="w-full px-6 py-6 rounded-xl bg-muted/50 border border-border min-h-[300px] prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                {@html marked.parse(form.excerpt|| "*Belum ada konten...*")}
              </div>
            {:else}
              <textarea 
                id="konten" rows="12" bind:value={form.excerpt} onkeydown={handleKeydown}
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
                  <button type="button" onclick={() => { imagePreview = ""; form.image = ""; selectedFile = null; }} class="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90 border border-red-500/20 shadow-sm" title="Hapus Foto">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              {/if}
              <div class="flex-1 w-full">
                <input id="foto" type="file" accept="image/*" onchange={handleFileChange} class="w-full px-5 py-2.5 rounded-xl bg-muted border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer" />
                <p class="text-[10px] text-muted-foreground mt-2 font-medium italic">Format: JPG, PNG, WEBP, HEIC. Maks 10MB.</p>
              </div>
            </div>
          </div>
        {/if}
      </div>
      <div class="pt-4 flex justify-end gap-3">
        <button type="button" onclick={() => isDialogOpen = false} class="px-6 py-2.5 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-all">Batal</button>
        <button type="submit" class="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all flex items-center gap-2" disabled={isSubmitting}>
          {#if isSubmitting}<Loader2 class="w-5 h-5 animate-spin" /> Menyimpan...{:else}<Save class="w-5 h-5" /> Simpan{/if}
        </button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={isDeleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Hapus Konten Berita</AlertDialog.Title>
      <AlertDialog.Description>Yakin ingin menghapus berita ini?</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
      <AlertDialog.Action onclick={deleteNews} variant="destructive">Hapus</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<style>
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  :global(.prose ul) { list-style-type: disc !important; list-style-position: outside !important; padding-left: 2rem !important; margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; }
  :global(.prose ol) { list-style-type: decimal !important; list-style-position: outside !important; padding-left: 2rem !important; margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; }
  :global(.prose li) { margin-bottom: 0.25rem !important; display: list-item !important; }
  :global(.prose ul ul, .prose ol ol, .prose ul ol, .prose ol ul) { margin-top: 0.25rem !important; margin-bottom: 0.25rem !important; padding-left: 1.5rem !important; }
</style>
