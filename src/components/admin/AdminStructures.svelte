<script lang="ts">
import { onMount } from "svelte";
import Loader2 from "@lucide/svelte/icons/loader-2";
import Users from "@lucide/svelte/icons/users";
import Plus from "@lucide/svelte/icons/plus";
import Trash2 from "@lucide/svelte/icons/trash-2";
import Save from "@lucide/svelte/icons/save";
import { upload } from "@vercel/blob/client";
import { api } from "@/lib/eden";
import { adminState, addToast } from "@/lib/adminState.svelte";
import AdminLayout from "./AdminLayout.svelte";
import { getOptimizedImageUrl } from "@/lib/utils";
import { commissions as staticCommissions } from "@/data/Commission";
import {
	leader as staticLeader,
	assistants as staticAssistants,
	administration as staticAdministration,
} from "@/data/Executive";

let isSubmitting = $state(false);
let isLoadingData = $state(false);
let fetched = false;

let structureData = $state({
	executive: {
		leader: staticLeader,
		assistants: staticAssistants,
		administration: staticAdministration,
	},
	commissions: staticCommissions,
});

let pendingUploads = new Map<string, File>();
let imagesToDelete = new Set<string>();

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
		const res = await api.structure.get();
		if (res.data && "data" in res.data && res.data.data) {
			structureData = res.data.data as any;
		}
	} catch (err) {
		console.error(err);
	} finally {
		isLoadingData = false;
	}
}

async function handleUpdateStructure() {
	isSubmitting = true;
	try {
		for (const [blobUrl, file] of pendingUploads.entries()) {
			const fileExtension = file.name.split(".").pop();
			const uuid = crypto.randomUUID();
			const fileName = `${uuid}.${fileExtension}`;

			await upload(`images/${fileName}`, file, {
				access: "public",
				handleUploadUrl: "/api/misc/upload",
				headers: { "x-api-key": adminState.apiKey },
			});

			const replaceBlobUrl = (obj: any) => {
				for (const key in obj) {
					if (typeof obj[key] === "string" && obj[key] === blobUrl) {
						obj[key] = fileName;
					} else if (typeof obj[key] === "object" && obj[key] !== null) {
						replaceBlobUrl(obj[key]);
					}
				}
			};
			replaceBlobUrl(structureData);
		}

		for (const fileName of imagesToDelete) {
			await fetch(`/api/misc/images/${fileName}`, {
				method: "DELETE",
				headers: { "x-api-key": adminState.apiKey },
			});
		}

		const { data, error } = await api.structure.put(structureData, {
			headers: { "x-api-key": adminState.apiKey },
		});
		if (error || !data || !data.success)
			throw new Error("Gagal memperbarui struktur.");

		pendingUploads.clear();
		imagesToDelete.clear();

		addToast("Berhasil", "Struktur organisasi berhasil diperbarui!");
	} catch (err: any) {
		addToast("Error", err.message || "Terjadi kesalahan.", "destructive");
	} finally {
		isSubmitting = false;
	}
}

function addAssistant() {
	structureData.executive.assistants = [
		...structureData.executive.assistants,
		{
			role: "WAKIL KETUA",
			name: "",
			class: "",
			description: "",
			image: "",
			color: "from-blue-500 to-indigo-600",
		},
	];
}
function removeAssistant(index: number) {
	const assistant = structureData.executive.assistants[index];
	if (assistant.image) {
		if (assistant.image.startsWith("blob:")) {
			pendingUploads.delete(assistant.image);
			URL.revokeObjectURL(assistant.image);
		} else {
			imagesToDelete.add(assistant.image);
		}
	}
	structureData.executive.assistants =
		structureData.executive.assistants.filter((_, i) => i !== index);
}
function addAdminMember() {
	structureData.executive.administration = [
		...structureData.executive.administration,
		{
			role: "STAF",
			name: "",
			class: "",
			description: "",
			image: "",
			color: "from-blue-500 to-indigo-600",
		},
	];
}
function removeAdminMember(index: number) {
	const admin = structureData.executive.administration[index];
	if (admin.image) {
		if (admin.image.startsWith("blob:")) {
			pendingUploads.delete(admin.image);
			URL.revokeObjectURL(admin.image);
		} else {
			imagesToDelete.add(admin.image);
		}
	}
	structureData.executive.administration =
		structureData.executive.administration.filter((_, i) => i !== index);
}
function addCommissionMember(commIndex: number) {
	structureData.commissions[commIndex].members = [
		...structureData.commissions[commIndex].members,
		"",
	];
}
function removeCommissionMember(commIndex: number, memberIndex: number) {
	structureData.commissions[commIndex].members = structureData.commissions[
		commIndex
	].members.filter((_, i) => i !== memberIndex);
}

async function handleStructureFileChange(e: Event, path: string) {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file) return;
	try {
		const keys = path.split(".");
		let current = structureData as any;
		for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];

		const oldImage = current[keys[keys.length - 1]];
		if (oldImage) {
			if (oldImage.startsWith("blob:")) {
				pendingUploads.delete(oldImage);
				URL.revokeObjectURL(oldImage);
			} else {
				imagesToDelete.add(oldImage);
			}
		}

		const blobUrl = URL.createObjectURL(file);
		pendingUploads.set(blobUrl, file);
		current[keys[keys.length - 1]] = blobUrl;
	} catch (err) {
		addToast("Error", "Gagal menyiapkan foto.", "destructive");
	}
}

function autoHeight(node: HTMLTextAreaElement, value: string) {
	const grow = () => {
		node.style.height = "auto";
		node.style.height = node.scrollHeight + "px";
	};
	setTimeout(grow, 0);
	node.addEventListener("input", grow);
	return {
		update() {
			grow();
		},
		destroy() {
			node.removeEventListener("input", grow);
		},
	};
}
</script>

<AdminLayout activeSection="structures">
  <div class="mb-8">
    <h2 class="text-2xl font-black text-foreground flex items-center gap-2">
      <Users class="w-6 h-6 text-primary" />
      Struktur Pengurus
    </h2>
    <p class="text-muted-foreground mt-1">Kelola data pengurus MPK dan anggota komisi.</p>
  </div>

  {#if isLoadingData}
    <div class="flex items-center justify-center py-20">
      <Loader2 class="w-10 h-10 animate-spin text-primary" />
    </div>
  {:else}
    <div class="space-y-12 max-w-4xl">
      <!-- BPH Section -->
      <div class="space-y-6">
        <div class="flex items-center gap-3 border-b border-border pb-2">
          <h3 class="text-lg font-black uppercase tracking-tight">Ketua Umum</h3>
        </div>

        <!-- Ketua Umum -->
        <div class="flex flex-col md:flex-row gap-6 py-6 relative">
          <div class="relative group w-32 h-44 shrink-0 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center self-center md:self-start mx-auto md:mx-0 shadow-sm">
            {#if structureData.executive.leader.image}
              <img src={getOptimizedImageUrl(structureData.executive.leader.image, 256, 352)} alt="Leader" class="w-full h-full object-cover" />
            {:else}
              <Users class="w-8 h-8 text-muted-foreground/30" />
            {/if}
            <label class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold gap-1">
              <Plus class="w-4 h-4" />
              <span>Upload</span>
              <input type="file" accept="image/*" class="hidden" onchange={(e) => handleStructureFileChange(e, 'executive.leader.image')} />
            </label>
          </div>

          <div class="flex-1 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2 space-y-1.5">
                <label for="leader-name" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nama Lengkap</label>
                <input id="leader-name" type="text" bind:value={structureData.executive.leader.name} class="w-full px-4 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-bold text-sm" />
              </div>
              <div class="space-y-1.5">
                <label for="leader-class" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Kelas</label>
                <input id="leader-class" type="text" bind:value={structureData.executive.leader.class} class="w-full px-4 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-medium text-sm" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label for="leader-description" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Deskripsi</label>
              <textarea id="leader-description" bind:value={structureData.executive.leader.description} use:autoHeight={structureData.executive.leader.description} placeholder="Tuliskan deskripsi" class="w-full px-4 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-medium text-sm resize-none overflow-hidden min-h-[40px]"></textarea>
            </div>
          </div>
        </div>

        <!-- Wakil Ketua -->
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-border pb-4 mt-8">
            <h4 class="font-black text-sm uppercase tracking-widest text-foreground">Wakil Ketua</h4>
            <button onclick={addAssistant} class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all text-[10px] font-black uppercase tracking-wider" title="Tambah Wakil">
              <Plus class="w-4 h-4" /> Tambah Wakil
            </button>
          </div>
          <div class="divide-y divide-border/50">
            {#each structureData.executive.assistants as assistant, i}
              <div class="py-8 flex flex-col md:flex-row gap-6 relative group/item">
                <div class="relative group w-32 h-44 shrink-0 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center self-center md:self-start mx-auto md:mx-0 shadow-sm">
                  {#if assistant.image}
                    <img src={getOptimizedImageUrl(assistant.image, 256, 352)} alt={assistant.role} class="w-full h-full object-cover" />
                  {:else}
                    <Users class="w-8 h-8 text-muted-foreground/30" />
                  {/if}
                  <label class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold gap-1">
                    <Plus class="w-4 h-4" /> Upload
                    <input type="file" accept="image/*" class="hidden" onchange={(e) => handleStructureFileChange(e, `executive.assistants.${i}.image`)} />
                  </label>
                </div>
                <div class="flex-1 space-y-4">
                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="sm:col-span-2 space-y-1.5">
                      <label for="assistant-name-{i}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nama Lengkap</label>
                      <input id="assistant-name-{i}" type="text" bind:value={assistant.name} class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-bold text-sm" />
                    </div>
                    <div class="space-y-1.5">
                      <label for="assistant-class-{i}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Kelas</label>
                      <input id="assistant-class-{i}" type="text" bind:value={assistant.class} class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-medium text-sm" />
                    </div>
                  </div>
                  <div class="space-y-4">
                    <div class="space-y-1.5">
                      <label for="assistant-role-{i}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Jabatan</label>
                      <input id="assistant-role-{i}" type="text" bind:value={assistant.role} placeholder="Contoh: KETUA 1" class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-black text-[10px] uppercase tracking-widest text-primary" />
                    </div>
                    <div class="space-y-1.5">
                      <label for="assistant-description-{i}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Deskripsi Tugas</label>
                      <textarea id="assistant-description-{i}" bind:value={assistant.description} use:autoHeight={assistant.description} placeholder="Tuliskan deskripsi tugas atau visi misi..." class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-medium text-sm resize-none overflow-hidden min-h-[42px]"></textarea>
                    </div>
                  </div>
                </div>
                <button onclick={() => removeAssistant(i)} class="absolute top-4 right-0 p-2 bg-red-500/5 text-red-600 rounded-xl border border-red-500/10 transition-all active:scale-90 shadow-xs hover:bg-red-500/10" title="Hapus Anggota">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- Administrasi -->
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-border pb-4 mt-8">
            <h4 class="font-black text-sm uppercase tracking-widest text-foreground">Administrasi</h4>
            <button onclick={addAdminMember} class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all text-[10px] font-black uppercase tracking-wider" title="Tambah Anggota">
              <Plus class="w-4 h-4" /> Tambah Administrasi
            </button>
          </div>
          <div class="divide-y divide-border/50">
            {#each structureData.executive.administration as admin, i}
              <div class="py-8 flex flex-col md:flex-row gap-6 relative group/item">
                <div class="relative group w-28 h-36 shrink-0 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center self-center md:self-start mx-auto md:mx-0 shadow-sm">
                  {#if admin.image}
                    <img src={getOptimizedImageUrl(admin.image, 224, 288)} alt={admin.role} class="w-full h-full object-cover" />
                  {:else}
                    <Users class="w-8 h-8 text-muted-foreground/30" />
                  {/if}
                  <label class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold gap-1">
                    <Plus class="w-4 h-4" /> Upload
                    <input type="file" accept="image/*" class="hidden" onchange={(e) => handleStructureFileChange(e, `executive.administration.${i}.image`)} />
                  </label>
                </div>
                <div class="flex-1 space-y-4">
                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="sm:col-span-2 space-y-1.5">
                      <label for="admin-name-{i}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nama Lengkap</label>
                      <input id="admin-name-{i}" type="text" bind:value={admin.name} class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-bold text-sm" />
                    </div>
                    <div class="space-y-1.5">
                      <label for="admin-class-{i}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Kelas</label>
                      <input id="admin-class-{i}" type="text" bind:value={admin.class} class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-medium text-sm" />
                    </div>
                  </div>
                  <div class="space-y-4">
                    <div class="space-y-1.5">
                      <label for="admin-role-{i}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Jabatan</label>
                      <input id="admin-role-{i}" type="text" bind:value={admin.role} placeholder="Contoh: SEKRETARIS 1" class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-black text-[10px] uppercase tracking-widest text-primary" />
                    </div>
                    <div class="space-y-1.5">
                      <label for="admin-description-{i}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Deskripsi Tugas</label>
                      <textarea id="admin-description-{i}" bind:value={admin.description} use:autoHeight={admin.description} placeholder="Tuliskan deskripsi tugas..." class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-medium text-sm resize-none overflow-hidden min-h-[42px]"></textarea>
                    </div>
                  </div>
                </div>
                <button onclick={() => removeAdminMember(i)} class="absolute top-4 right-0 p-2 bg-red-500/5 text-red-600 rounded-xl border border-red-500/10 transition-all active:scale-90 shadow-xs hover:bg-red-500/10" title="Hapus Anggota">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Commissions Section -->
      <div class="space-y-6">
        <div class="flex items-center gap-3 border-b border-border pb-2">
          <h3 class="text-lg font-black uppercase tracking-tight">Komisi</h3>
        </div>
        <div class="divide-y divide-border/50">
          {#each structureData.commissions as commission, ci}
            <div class="py-12 space-y-8">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-black text-lg uppercase tracking-tight leading-tight text-foreground">{commission.title}</h4>
                  <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{commission.subtitle}</p>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
                <!-- Left Column: Icon & Info -->
                <div class="md:col-span-4 space-y-6">
                  <div class="relative group aspect-square max-w-[140px] mx-auto md:mx-0 rounded-3xl overflow-hidden bg-muted border border-border flex items-center justify-center shadow-inner">
                    {#if commission.image}
                      <img src={getOptimizedImageUrl(commission.image, 280, 280)} alt={commission.title} class="w-full h-full object-cover" />
                    {:else}
                      <Users class="w-10 h-10 text-muted-foreground/30" />
                    {/if}
                    <label class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold gap-2">
                      <Plus class="w-5 h-5" /> Ganti Foto
                      <input type="file" accept="image/*" class="hidden" onchange={(e) => handleStructureFileChange(e, `commissions.${ci}.image`)} />
                    </label>
                  </div>
                  <div class="space-y-4">
                    <div class="space-y-1.5">
                      <label for="comm-fullname-{ci}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nama Lengkap Komisi</label>
                      <input id="comm-fullname-{ci}" type="text" bind:value={commission.fullName} class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-bold text-sm" />
                    </div>
                    <div class="grid grid-cols-1 gap-3">
                      <div class="space-y-1.5">
                        <label for="comm-coord-{ci}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Koordinator</label>
                        <input id="comm-coord-{ci}" type="text" bind:value={commission.coordinator.name} class="w-full px-4 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-bold text-xs" />
                      </div>
                      <div class="space-y-1.5">
                        <label for="comm-class-{ci}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Kelas</label>
                        <input id="comm-class-{ci}" type="text" bind:value={commission.coordinator.class} class="w-full px-4 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-medium text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right Column: Description & Members -->
                <div class="md:col-span-8 space-y-6">
                  <div class="space-y-1.5">
                    <label for="comm-desc-{ci}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Deskripsi Tugas</label>
                    <textarea id="comm-desc-{ci}" bind:value={commission.description} use:autoHeight={commission.description} placeholder="Tuliskan deskripsi tugas komisi..." class="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-medium text-sm resize-none overflow-hidden min-h-[100px]"></textarea>
                  </div>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between mb-2">
                      <label for="commission-member-{ci}" class="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Daftar Anggota</label>
                      <button onclick={() => addCommissionMember(ci)} class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all text-[10px] font-black uppercase tracking-wider">
                        <Plus class="w-3.5 h-3.5" /> Tambah Anggota
                      </button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {#each commission.members as member, mi}
                        <div class="flex flex-col gap-1.5 group/member">
                          <div class="flex items-center gap-2">
                            <input id="comm-{ci}-member-{mi}" type="text" bind:value={commission.members[mi]} placeholder="Nama Anggota (Kelas)" class="flex-1 px-4 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-medium text-xs" />
                            <button onclick={() => removeCommissionMember(ci, mi)} class="p-2 bg-red-500/5 text-red-600 rounded-xl border border-red-500/10 transition-all active:scale-90 shadow-xs hover:bg-red-500/10" title="Hapus Anggota">
                              <Trash2 class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="mt-16 pt-8 border-t border-border flex justify-center sm:justify-end pb-10">
      <button onclick={handleUpdateStructure} class="w-full sm:w-auto px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98]" disabled={isSubmitting}>
        {#if isSubmitting}<Loader2 class="w-6 h-6 animate-spin" /><span>Menyimpan...</span>{:else}<Save class="w-6 h-6" /><span>Simpan Perubahan</span>{/if}
      </button>
    </div>
  {/if}
</AdminLayout>
