import { CustomSidebar } from "@/components/custom/CustomSidebar"
import type { NavigationItem } from "@/components/custom/navigation-item"
import { TopBar } from "@/components/custom/TopBar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useLocation } from "react-router-dom"

type StudentLayoutProps = {
  children: React.ReactNode
  navigationItems: NavigationItem[]
}

const routeLabels: Record<string, string> = {
  "/student": "Dashboard",
  "/student/exams": "My Exams",
  "/instructor": "Dashboard",
  "/instructor/exams": "Exams",
  "/instructor/students": "Students",
  "/admin": "Dashboard",
  "/admin/accounts": "Accounts",
  "/admin/courses": "Courses",
  "/profile": "Profile",
}

const AuthLayout = ({ children, navigationItems }: StudentLayoutProps) => {
  const { pathname } = useLocation()
  const navigator = routeLabels[pathname] || "Dashboard" // Fallback to "Dashboard" if path not found

  return (
    <SidebarProvider>
      <TooltipProvider>
        {/* Sidebar */}
        <CustomSidebar navItems={navigationItems} />

        {/* Main content */}
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <TopBar navigator={navigator} />
          {children}
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  )
}

export default AuthLayout