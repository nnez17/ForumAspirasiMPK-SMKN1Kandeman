<script lang="ts">
import CircleCheck from "@lucide/svelte/icons/circle-check";
import Clock from "@lucide/svelte/icons/clock";
import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
import { onMount } from "svelte";
import { cubicOut } from "svelte/easing";
import { Tween } from "svelte/motion";
import { api } from "@/lib/eden";

// Tweened values for animations
const totalCount = new Tween(0, { duration: 800, easing: cubicOut });
const urgentCount = new Tween(0, { duration: 800, easing: cubicOut });
const midCount = new Tween(0, { duration: 800, easing: cubicOut });
const infoCount = new Tween(0, { duration: 800, easing: cubicOut });

async function fetchStats() {
	try {
		const { data, error } = await api.aspirasi.stats.get();
		if (!error && data?.success) {
			const stats = data.data;
			totalCount.set(stats.total);
			urgentCount.set(stats.urgent);
			midCount.set(stats.mid);
			infoCount.set(stats.info);
		}
	} catch (err) {
		console.error("Failed to fetch stats:", err);
	}
}

onMount(() => {
	fetchStats();

	let interval: ReturnType<typeof setInterval>;

	const startInterval = () => {
		stopInterval();
		interval = setInterval(fetchStats, 5000);
	};

	const stopInterval = () => {
		if (interval) clearInterval(interval);
	};

	const handleVisibilityChange = () => {
		if (document.visibilityState === "visible") {
			fetchStats();
			startInterval();
		} else {
			stopInterval();
		}
	};

	document.addEventListener("visibilitychange", handleVisibilityChange);
	startInterval();

	return () => {
		stopInterval();
		document.removeEventListener("visibilitychange", handleVisibilityChange);
	};
});
</script>

<section class="container mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Live Monitoring Aspirasi</h2>
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-semibold self-start sm:self-auto">
      <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
      Status Terhubung Real-Time
    </div>
  </div>

  <!-- Total Aspirasi -->
  <div class="p-4 sm:p-6 pb-6 sm:pb-8 flex flex-col items-center justify-center text-center">
    <span class="text-sm font-medium text-gray-500 mb-2">Total Aspirasi Masuk</span>
    <span class="text-4xl sm:text-5xl font-extrabold text-primary border-b-4 border-primary pb-2">
      {Math.round(totalCount.current)}
    </span>
  </div>

  <!-- Darurat, Sedang, Info -->
  <div class="grid grid-cols-3 w-full gap-3 sm:gap-4 md:gap-6">
    <!-- Card 1 (Urgent) -->
    <div class="bg-red-50/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-red-100 flex flex-col items-center justify-center text-center">
      <Clock class="text-red-500 mb-1 sm:mb-2 w-5 h-5 sm:w-6 sm:h-6" />
      <span class="text-[10px] sm:text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Darurat</span>
      <span class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-red-600">
        {Math.round(urgentCount.current)}
      </span>
    </div>

    <!-- Card 2 (Mid) -->
    <div class="bg-yellow-50/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-yellow-200 flex flex-col items-center justify-center text-center">
      <TriangleAlert class="text-yellow-600 mb-1 sm:mb-2 w-5 h-5 sm:w-6 sm:h-6" />
      <span class="text-[10px] sm:text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">Sedang</span>
      <span class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-yellow-700">
        {Math.round(midCount.current)}
      </span>
    </div>

    <!-- Card 3 (Info) -->
    <div class="bg-blue-50/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-blue-200 flex flex-col items-center justify-center text-center">
      <CircleCheck class="text-blue-500 mb-1 sm:mb-2 w-5 h-5 sm:w-6 sm:h-6" />
      <span class="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Info</span>
      <span class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary">
        {Math.round(infoCount.current)}
      </span>
    </div>
  </div>
</section>
