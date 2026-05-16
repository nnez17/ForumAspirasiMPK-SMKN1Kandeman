<script lang="ts">
import { onMount } from "svelte";
import Loader2 from "@lucide/svelte/icons/loader-2";
import Settings from "@lucide/svelte/icons/settings";
import Save from "@lucide/svelte/icons/save";
import ImageIcon from "@lucide/svelte/icons/image";
import Trash2 from "@lucide/svelte/icons/trash-2";
import Upload from "@lucide/svelte/icons/upload";
import { upload } from "@vercel/blob/client";
import { api } from "@/lib/eden/client";
import { adminState, addToast } from "@/lib/adminState.svelte";
import { getOptimizedImageUrl } from "@/lib/utils";
import AdminLayout from "./AdminLayout.svelte";

let isLoadingData = $state(false);
let isSavingHero = $state(false);
let isSavingPeriod = $state(false);
let fetched = false;

// Hero state
let heroImage = $state("");
let heroPreview = $state("");
let selectedHeroFile = $state<File | null>(null);
let oldHeroImage = $state("");

// Period state
let periodYears = $state("");

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
		const [heroRes, periodRes] = await Promise.all([
			api.config.hero.get(),
			api.config.period.get(),
		]);

		if (heroRes.data && "data" in heroRes.data && heroRes.data.data) {
			heroImage = heroRes.data.data.image ?? "";
			oldHeroImage = heroImage;
			heroPreview = heroImage
				? getOptimizedImageUrl(heroImage, 800, 400)
				: "";
		}

		if (periodRes.data && "data" in periodRes.data && periodRes.data.data) {
			periodYears = periodRes.data.data.years ?? "";
		}
	} catch (err) {
		console.error(err);
		addToast("Error", "Gagal memuat data pengaturan.", "destructive");
	} finally {
		isLoadingData = false;
	}
}

function handleHeroFileChange(e: Event) {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file) return;

	selectedHeroFile = file;
	heroPreview = URL.createObjectURL(file);
}

function removeHeroPreview() {
	heroPreview = "";
	heroImage = "";
	selectedHeroFile = null;
}

async function saveHero() {
	isSavingHero = true;

	try {
		let imageValue = heroImage;

		if (selectedHeroFile) {
			const fileExtension = selectedHeroFile.name.split(".").pop();
			const uuid = crypto.randomUUID();
			const fileName = `${uuid}.${fileExtension}`;

			await upload(`images/${fileName}`, selectedHeroFile, {
				access: "public",
				handleUploadUrl: "/api/misc/upload",
				headers: { "x-api-key": adminState.apiKey },
			});

			imageValue = fileName;

			// Delete old blob image if it was a blob file (not a local path)
			if (
				oldHeroImage &&
				!oldHeroImage.startsWith("/") &&
				!oldHeroImage.startsWith("http")
			) {
				try {
					await api.misc
						// @ts-expect-error wildcard route works fine
						.images({ "*": oldHeroImage })
						.delete(null, {
							headers: { "x-api-key": adminState.apiKey },
						});
				} catch {
					// Silently ignore cleanup errors
				}
			}
		}

		const { data, error } = await api.config.hero.put(
			{ image: imageValue },
			{ headers: { "x-api-key": adminState.apiKey } },
		);

		if (error || !data || !data.success) {
			throw new Error("Gagal menyimpan gambar hero.");
		}

		heroImage = imageValue;
		oldHeroImage = imageValue;
		selectedHeroFile = null;
		heroPreview = imageValue
			? getOptimizedImageUrl(imageValue, 800, 400)
			: "";

		addToast("Berhasil", "Gambar hero berhasil diperbarui!");
	} catch (err: any) {
		addToast(
			"Error",
			err.message || "Gagal menyimpan gambar hero.",
			"destructive",
		);
	} finally {
		isSavingHero = false;
	}
}

async function savePeriod() {
	isSavingPeriod = true;

	try {
		const { data, error } = await api.config.period.put(
			{ years: periodYears },
			{ headers: { "x-api-key": adminState.apiKey } },
		);

		if (error || !data || !data.success) {
			throw new Error("Gagal menyimpan periode.");
		}

		addToast("Berhasil", "Periode berhasil diperbarui!");
	} catch (err: any) {
		addToast(
			"Error",
			err.message || "Gagal menyimpan periode.",
			"destructive",
		);
	} finally {
		isSavingPeriod = false;
	}
}
</script>

<AdminLayout activeSection="settings">
  <div class="mb-8">
    <h2 class="text-2xl font-black text-foreground flex items-center gap-2">
      <Settings class="w-6 h-6 text-primary" />
      Pengaturan
    </h2>
    <p class="text-muted-foreground mt-1">Konfigurasi tampilan dan informasi umum website.</p>
  </div>

  {#if isLoadingData}
    <div class="flex items-center justify-center py-20">
      <Loader2 class="w-10 h-10 animate-spin text-primary" />
    </div>
  {:else}
    <div class="space-y-12 max-w-4xl">

      <!-- Hero Image Section -->
      <div class="space-y-6">
        <div class="flex items-center gap-3 border-b border-border pb-2">
          <h3 class="text-lg font-black uppercase tracking-tight">Gambar Hero / Banner</h3>
        </div>

        <div class="space-y-6 py-4">
          <!-- Image Preview -->
          <div class="relative group w-full h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center shadow-sm">
            {#if heroPreview}
              <img
                src={heroPreview}
                alt="Hero Banner Preview"
                class="w-full h-full object-cover"
              />
              <label class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold gap-2">
                <Upload class="w-5 h-5" />
                <span>Ganti Gambar Banner</span>
                <input type="file" accept="image/*" class="hidden" onchange={handleHeroFileChange} />
              </label>
            {:else}
              <div class="flex flex-col items-center justify-center gap-3">
                <Upload class="w-10 h-10 text-muted-foreground/30" />
                <span class="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">Belum ada banner</span>
              </div>
              <label class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold gap-2">
                <Upload class="w-5 h-5" />
                <span>Upload Banner</span>
                <input type="file" accept="image/*" class="hidden" onchange={handleHeroFileChange} />
              </label>
            {/if}
            {#if selectedHeroFile}
              <div class="absolute top-4 left-4 px-3 py-1.5 bg-amber-500/90 text-white text-[10px] font-black uppercase tracking-wider rounded-lg backdrop-blur-sm">
                Belum Tersimpan
              </div>
            {/if}
            {#if heroPreview}
               <button
                type="button"
                onclick={removeHeroPreview}
                class="absolute top-4 right-4 p-2 bg-red-500/90 text-white rounded-xl transition-all active:scale-90 shadow-xs opacity-0 group-hover:opacity-100"
                title="Hapus Gambar"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            {/if}
          </div>

          <div class="space-y-1.5 pt-2">
             <label for="hero-upload" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Pilih File Banner Baru</label>
              <input
                id="hero-upload"
                type="file"
                accept="image/*"
                onchange={handleHeroFileChange}
                class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-medium text-xs file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
              />
             <p class="text-[10px] text-muted-foreground font-medium italic ml-1">Maksimum ukuran 10MB. Format yang didukung: JPG, PNG, WEBP, HEIC.</p>
          </div>
        </div>
      </div>

      <!-- Period Year Section -->
      <div class="space-y-6">
        <div class="flex items-center gap-3 border-b border-border pb-2">
          <h3 class="text-lg font-black uppercase tracking-tight">Periode Kepengurusan</h3>
        </div>

        <div class="py-2">
          <div class="space-y-1.5 max-w-sm">
            <label for="period-years" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Tahun Periode Berjalan</label>
            <input
              id="period-years"
              type="text"
              bind:value={periodYears}
              placeholder="Contoh: 2025/2026"
              class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-bold text-sm"
              required
            />
            <p class="text-[10px] text-muted-foreground font-medium italic ml-1">
              Format yang disarankan: tahun awal/tahun akhir (contoh: 2025/2026)
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="mt-16 pt-8 border-t border-border flex justify-center sm:justify-end gap-3 pb-10">
      <button
        type="button"
        onclick={async () => {
           await saveHero();
           await savePeriod();
        }}
        disabled={isSavingHero || isSavingPeriod}
        class="w-full sm:w-auto px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if isSavingHero || isSavingPeriod}
          <Loader2 class="w-6 h-6 animate-spin" /><span>Menyimpan...</span>
        {:else}
          <Save class="w-6 h-6" /><span>Simpan Perubahan</span>
        {/if}
      </button>
    </div>
  {/if}
</AdminLayout>
