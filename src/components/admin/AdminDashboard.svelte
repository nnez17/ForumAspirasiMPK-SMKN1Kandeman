<script lang="ts">
import { onMount } from "svelte";
import Loader2 from "@lucide/svelte/icons/loader-2";
import Newspaper from "@lucide/svelte/icons/newspaper";
import MessageSquare from "@lucide/svelte/icons/message-square";
import { api } from "@/lib/eden/client";
import { adminState } from "@/lib/adminState.svelte";
import { Skeleton } from "@/components/ui/skeleton/index.js";
import AdminLayout from "./AdminLayout.svelte";

let isLoadingData = $state(false);
let aspirationsCount = $state(0);
let newsCount = $state(0);
let fetched = false;

onMount(async () => {
	if (adminState.apiKey) {
		fetchData();
	}
});

$effect(() => {
	if (adminState.apiKey && !fetched) {
		fetchData();
	}
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
			aspirationsCount = aspRes.data.data.length;
		}
		const newsRes = await api.news.get();
		if (newsRes.data && "data" in newsRes.data && newsRes.data.data) {
			newsCount = newsRes.data.data.length;
		}
	} catch (err) {
		console.error(err);
	} finally {
		isLoadingData = false;
	}
}
</script>

<AdminLayout activeSection="dashboard">
  <div class="space-y-8">
    <!-- Clean Header -->
    <div class="pb-6 border-b border-border/50">
      <h1 class="text-3xl font-black text-foreground tracking-tight mb-2">Overview</h1>
      <p class="text-muted-foreground">Statistik Konten & Aspirasi</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- News Card -->
      <a href="/admin/blog" class="block p-8 rounded-2xl bg-muted/30 border border-border">
      <div class="flex items-center gap-4 mb-6">
        <div class="p-2.5 bg-background rounded-lg border border-border text-primary">
          <Newspaper class="w-5 h-5" />
        </div>
        <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Blog & Berita</span>
        </div>
        <div>
          <div class="text-5xl font-black text-foreground tracking-tighter mb-1">
            {#if isLoadingData}
              <Skeleton class="h-12 w-16" />
            {:else}
              {newsCount}
            {/if}
          </div>
          <p class="text-sm font-medium text-muted-foreground">Total artikel dipublikasikan</p>
        </div>
      </a>

      <!-- Aspirasi Card -->
      <a href="/admin/aspirasi" class="block p-8 rounded-2xl bg-muted/30 border border-border">
        <div class="flex items-center gap-4 mb-6">
          <div class="p-2.5 bg-background rounded-lg border border-border text-primary">
            <MessageSquare class="w-5 h-5" />
          </div>
          <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Aspirasi Siswa</span>
        </div>
        <div>
          <div class="text-5xl font-black text-foreground tracking-tighter mb-1">
            {#if isLoadingData}
              <Skeleton class="h-12 w-16" />
            {:else}
              {aspirationsCount}
            {/if}
          </div>
          <p class="text-sm font-medium text-muted-foreground">Total pesan aspirasi masuk</p>
        </div>
      </a>
    </div>
  </div>
</AdminLayout>
