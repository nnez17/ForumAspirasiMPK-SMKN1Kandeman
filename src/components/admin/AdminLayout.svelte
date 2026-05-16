<script lang="ts">
import { onMount } from "svelte";
import { flip } from "svelte/animate";
import * as Alert from "@/components/ui/alert/index.js";
import Loader2 from "@lucide/svelte/icons/loader-2";
import LogOut from "@lucide/svelte/icons/log-out";
import X from "@lucide/svelte/icons/x";
import ShieldCheck from "@lucide/svelte/icons/shield-check";
import Newspaper from "@lucide/svelte/icons/newspaper";
import Edit from "@lucide/svelte/icons/edit";
import MessageSquare from "@lucide/svelte/icons/message-square";
import Users from "@lucide/svelte/icons/users";
import SettingsIcon from "@lucide/svelte/icons/settings";
import { api } from "@/lib/eden/client";
import {
	adminState,
	addToast,
	removeToast,
	initAuth,
	logout,
} from "@/lib/adminState.svelte";

let { children, activeSection = "dashboard" } = $props();

let passwordInput = $state("");
let isLoggingIn = $state(false);

onMount(() => {
	initAuth();
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

		adminState.apiKey = data.data.key;
		localStorage.setItem("admin_xkey", adminState.apiKey);
		localStorage.setItem("admin_authenticated", "true");
		adminState.isAuthenticated = true;
		addToast("Berhasil", "Selamat datang kembali, Admin.");
	} catch (err) {
		addToast("Error", "Terjadi kesalahan koneksi.", "destructive");
	} finally {
		isLoggingIn = false;
	}
}
</script>

<!-- Toast Container -->
<div class="fixed top-20 left-4 right-4 md:top-24 md:left-auto md:right-6 z-100 w-[calc(100%-2rem)] md:w-full md:max-w-sm space-y-3 pointer-events-none mx-auto md:mx-0">
  {#each adminState.toastAlerts as alert (alert.id)}
    <div animate:flip={{ duration: 300 }} class="pointer-events-auto">
      <Alert.Root variant={alert.variant} class="shadow-2xl border-none backdrop-blur-md bg-background/95 ring-1 ring-border relative group">
        <Alert.Title class="font-black uppercase tracking-widest text-[10px] flex items-center justify-between">
          {alert.title}
          <button 
            onclick={() => removeToast(alert.id)}
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

{#if !adminState.isAuthenticated}
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
          onclick={logout}
          class="flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 bg-destructive/5 md:bg-transparent w-full md:w-auto px-4 py-3 md:py-2 rounded-xl md:rounded-lg transition-colors font-bold text-sm shrink-0"
        >
          <LogOut class="w-4 h-4" />
          Logout
        </button>
      </div>

      <div class="flex flex-col md:flex-row gap-8 md:gap-12">
        <div class="w-full md:w-64 shrink-0">
          <nav class="flex flex-col md:sticky md:top-28 gap-2">
            <a
              href="/admin"
              class={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeSection === "dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Newspaper class="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            <a
              href="/admin/blog"
              class={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeSection === "blog" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Edit class="w-5 h-5" />
              <span>Kelola Blog</span>
            </a>
            <a
              href="/admin/aspirasi"
              class={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeSection === "aspirasi" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <MessageSquare class="w-5 h-5" />
              <span>Aspirasi Siswa</span>
            </a>
            <a
              href="/admin/structures"
              class={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeSection === "structures" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Users class="w-5 h-5" />
              <span>Struktur Pengurus</span>
            </a>
            <a
              href="/admin/settings"
              class={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeSection === "settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <SettingsIcon class="w-5 h-5" />
              <span>Pengaturan</span>
            </a>
          </nav>
        </div>

        <div class="flex-1">
          {@render children()}
        </div>
      </div>
    </div>
  </main>
{/if}
