import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"


const TopBar = ({ navigator }: { navigator: string }) => {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background px-4 sm:px-5">
      <SidebarTrigger className="h-10 w-10 md:hidden" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <span className="text-sm font-semibold text-foreground">{navigator}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

export { TopBar }