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
import {
  LayoutDashboard,
  BarChart3,
} from "lucide-react"
import { NavigationUser } from "./NavigationUser"

// ── Nav items with their routes ─────────────────────────────────────────────

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/student/" },
  { label: "Analytics", icon: BarChart3, path: "/student/analytics" },
]

// ── Shared Sidebar ──────────────────────────────────────────────────────────

export function StudentSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-green-500 text-white font-bold text-sm shrink-0">
            L
          </div>
          <span className="font-semibold text-sm truncate group-data-[collapsible=icon]:hidden">
            VSU Review Center
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
                const isActive = pathname === item.path || (item.path !== "/student/" && pathname.startsWith(item.path))
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
