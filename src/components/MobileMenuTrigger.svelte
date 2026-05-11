<script lang="ts">
import { Menu } from "@lucide/svelte";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

const sidebar = useSidebar();
</script>

<Button 
  variant="ghost" 
  size="icon" 
  class="text-primary hover:bg-primary/10 transition-colors shrink-0"
  onclick={() => sidebar.setOpenMobile(true)}
>
  <Menu class="h-8 w-8" />
  <span class="sr-only">Toggle Menu</span>
</Button>
