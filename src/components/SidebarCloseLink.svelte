<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { useSidebar } from "@/components/ui/sidebar";

let {
	href,
	name,
	class: className,
	...restProps
}: {
	href: string;
	name: string;
} & HTMLAttributes<HTMLAnchorElement> = $props();

const sidebar = useSidebar();
</script>

<a 
  href={href} 
  class={className}
  {...restProps}
  onclick={(e) => {
    // @ts-ignore
    restProps.onclick?.(e);
    sidebar.setOpenMobile(false);
  }}
>
  {name}
</a>
