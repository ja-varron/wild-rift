import { useNavigate, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { NavigationUser } from "./NavigationUser"
import type { NavigationItem } from "./navigation-item"
import { useFetchProfile } from "@/lib/supabase/authentication/context/use-fetch-profile"

type NavigationItemProps = {
  navItems: NavigationItem[]
}

// ── Shared Sidebar ──────────────────────────────────────────────────────────

const CustomSidebar = ({ navItems }: NavigationItemProps) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { userProfile, isLoading } = useFetchProfile()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b h-16 px-4 py-0 group-data-[collapsible=icon]:px-0">
        <div className="flex h-full w-full items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex min-w-0 items-center gap-3 group-data-[collapsible=icon]:hidden">
            <img src="/logo.png" alt="Tuon logo" className="size-10 shrink-0 object-contain" />
            <span className="truncate text-lg font-semibold tracking-tight leading-none">
              Tuon
            </span>
          </div>
          <SidebarTrigger className="h-10 w-10 shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isIndexPath = !item.path.replace(/\/$/, "").slice(1).includes("/") // e.g. /student, /instructor
                const isActive = pathname === item.path || (!isIndexPath && pathname.startsWith(item.path))
                return (
                  <SidebarMenuItem key={item.label}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          isActive={isActive}
                          className="h-10 gap-2.5"
                          onClick={() => navigate(item.path)}
                        >
                          <item.icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <NavigationUser user={{
          name: userProfile?.fullName ?? (isLoading ? "Loading..." : "User"),
          email: userProfile?.getEmailAddress ?? "...",
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}

export { CustomSidebar }
