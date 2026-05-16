<script lang="ts">
import { onMount } from "svelte";
import Loader2 from "@lucide/svelte/icons/loader-2";
import MessageSquare from "@lucide/svelte/icons/message-square";
import LinkIcon from "@lucide/svelte/icons/link";
import { api } from "@/lib/eden/client";
import { adminState } from "@/lib/adminState.svelte";
import { Skeleton } from "@/components/ui/skeleton/index.js";
import AdminLayout from "./AdminLayout.svelte";

let aspirations: any[] = $state([]);
let isLoadingData = $state(false);
let fetched = false;

let aspirationStatusFilter = $state("Semua");
let filteredAspirations = $derived(
	aspirations.filter((a) => {
		const matchesStatus =
			aspirationStatusFilter === "Semua" ||
			a.status?.includes(aspirationStatusFilter);
		return matchesStatus;
	}),
);

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
		const aspRes = await api.aspirasi.get({
			headers: { "x-api-key": adminState.apiKey },
		});
		if (aspRes.data && "data" in aspRes.data && aspRes.data.data) {
			aspirations = aspRes.data.data;
		}
	} catch (err) {
		console.error(err);
	} finally {
		isLoadingData = false;
	}
}
</script>

<AdminLayout activeSection="aspirasi">
  <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
    <div>
      <h2 class="text-2xl font-black text-foreground flex items-center gap-2">
        <MessageSquare class="w-6 h-6 text-primary" />
        Aspirasi Masuk
      </h2>
      <p class="text-muted-foreground mt-1">Daftar aspirasi dari siswa yang perlu ditinjau.</p>
    </div>
    <select bind:value={aspirationStatusFilter} class="px-4 py-2.5 rounded-xl bg-muted border border-transparent focus:bg-background focus:border-primary outline-none transition-all text-sm font-bold shadow-sm cursor-pointer">
      <option value="Semua">Semua Status</option>
      <option value="Darurat">Darurat</option>
      <option value="Sedang">Sedang</option>
      <option value="Informasi">Informasi</option>
    </select>
  </div>

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
        {#if isLoadingData}
          {#each Array(5) as _}
            <tr>
              <td class="py-4 pr-4">
                <Skeleton class="h-4 w-24 mb-1" />
                <Skeleton class="h-3 w-16" />
              </td>
              <td class="py-4 px-4 hidden sm:table-cell"><Skeleton class="h-4 w-full max-w-[200px]" /></td>
              <td class="py-4 px-4 text-center hidden md:table-cell"><Skeleton class="h-6 w-16 mx-auto rounded-full" /></td>
              <td class="py-4 px-4 text-right"><Skeleton class="h-8 w-16 ml-auto rounded-lg" /></td>
            </tr>
          {/each}
        {:else}
          {#each filteredAspirations as item}
            <tr class="hover:bg-muted/50 transition-colors group">
              <td class="py-4 pr-4">
                <div class="font-bold text-foreground whitespace-nowrap">{item.name}</div>
                <div class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.class}</div>
                <div class="mt-2 sm:hidden">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap {item.status?.includes('Darurat') ? 'bg-red-500/10 text-red-600' : item.status?.includes('Sedang') ? 'bg-amber-500/10 text-amber-600' : item.status?.includes('Informasi') ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}">
                    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {item.status?.split(' ')[0] || "Pending"}
                  </span>
                </div>
                <div class="mt-2 text-xs text-muted-foreground sm:hidden line-clamp-2">{item.content}</div>
              </td>
              <td class="py-4 px-4 text-sm text-muted-foreground max-w-[200px] md:max-w-[300px] hidden sm:table-cell">
                <p class="truncate">{item.content}</p>
                <div class="mt-2 md:hidden">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap {item.status?.includes('Darurat') ? 'bg-red-500/10 text-red-600' : item.status?.includes('Sedang') ? 'bg-amber-500/10 text-amber-600' : item.status?.includes('Informasi') ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}">
                    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {item.status?.split(' ')[0] || "Pending"}
                  </span>
                </div>
              </td>
              <td class="py-4 px-4 text-center hidden md:table-cell">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap {item.status?.includes('Darurat') ? 'bg-red-500/10 text-red-600' : item.status?.includes('Sedang') ? 'bg-amber-500/10 text-amber-600' : item.status?.includes('Informasi') ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}">
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
            <tr><td colspan="4" class="text-center py-8 text-muted-foreground font-medium"> Belum ada aspirasi yang masuk. </td></tr>
          {/if}
        {/if}
      </tbody>
    </table>
  </div>
</AdminLayout>
