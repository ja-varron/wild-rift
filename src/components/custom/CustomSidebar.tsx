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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { NavigationUser } from "./NavigationUser"
import type { NavigationItem } from "./navigation-item"

type NavigationItemProps = {
  navItems: NavigationItem[]
}

// ── Shared Sidebar ──────────────────────────────────────────────────────────

const CustomSidebar = ({ navItems }: NavigationItemProps) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="size-8" />
          <span className="font-semibold text-sm truncate group-data-[collapsible=icon]:hidden">
            Tuon
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs text-muted-foreground px-2">
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
                          className="gap-2"
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
          name: "John Doe",
          email: "john.doe@vsu.edu.ph",
          avatar: "https://example.com/avatar.jpg"
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}

export { CustomSidebar }
