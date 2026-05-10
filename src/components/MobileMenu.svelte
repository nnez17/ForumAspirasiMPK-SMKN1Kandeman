<script lang="ts">
import * as Sidebar from "@/components/ui/sidebar";
import MobileMenuTrigger from "./MobileMenuTrigger.svelte";
import SidebarCloseLink from "./SidebarCloseLink.svelte";

let {
	links = [
		{ name: "Beranda", href: "#home" },
		{ name: "Berita", href: "#berita" },
		{ name: "Pengurus", href: "#pengurus" },
		{ name: "Kontak", href: "#kontak" },
		{ name: "Admin", href: "/admin" },
	],
} = $props();
</script>

<Sidebar.Provider class="contents">
  <Sidebar.Root side="left" class="z-110">
    <Sidebar.Header class="p-6 border-b border-sidebar-border bg-primary/5">
      <h2 class="text-primary font-bold text-2xl tracking-tighter">
        MPK SMKN 1 KANDEMAN
      </h2>
    </Sidebar.Header>
    <Sidebar.Content class="p-4 bg-background">
      <Sidebar.Group>
        <Sidebar.Menu class="space-y-2">
          {#each links as link}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton 
                size="lg" 
                class="h-14 px-4 rounded-xl text-base font-bold transition-all hover:bg-primary/10"
              >
                <SidebarCloseLink href={link.href} name={link.name} />
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
  </Sidebar.Root>

  <MobileMenuTrigger />
</Sidebar.Provider>
