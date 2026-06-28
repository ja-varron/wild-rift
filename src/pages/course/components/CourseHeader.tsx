import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Link } from "lucide-react"
import { ErrorBoundary } from "react-error-boundary"

const CourseHeader = () => {
  return (
    <>
      {/* Header */}
      <ErrorBoundary fallback={<div>Error Loading Course Header</div>}>
        <div className="flex flex-col sm:flex-row items-start gap-5 px-6 md:px-8 lg:px-10 py-5">
          <div className="w-full sm:w-1/4">
            <img src="/profiles/exam-profile-1.jpg" alt="" className="aspect-4/3 w-full object-cover" />
          </div>
          <div className="flex flex-col py-4 md:py-7 lg:py-10 gap-3">
            <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Agriculture and Biosystems Engineering Licensure Examination</h1>
            <p className="text-sm">Lorem ipsum dolor sit amet consectetur adipisicing elit. Iste, velit. Natus nostrum dignissimos, quo vero quaerat dolor minima eum numquam vitae fugiat quidem repellendus molestias voluptas dolores nam sunt! Reprehenderit.</p>
            <h4 className="text-lg font-bold">Exam Date: <span className="font-normal">November 24-26, 2026</span></h4>
          </div>
        </div>
      </ErrorBoundary>

      {/* Navigation */}
      <ErrorBoundary fallback={<div>Error Loading Course Navigation</div>}>
        <div className="px-4 md:px-8 lg:px-10">
          <Separator className="w-full h-2 bg-[#F2F2F2] border-t-2" />
        </div>
      </ErrorBoundary>

      {/* Content Navigation Tabs */}
      <ErrorBoundary fallback={<div>Error Loading Course Navigation Tabs</div>}>
        <div className="px-6 md:px-8 lg:px-10 py-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Course Overview</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="ghost">
                      <BreadcrumbEllipsis />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuItem>Documentation</DropdownMenuItem>
                      <DropdownMenuItem>Themes</DropdownMenuItem>
                      <DropdownMenuItem>GitHub</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="#">Components</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </ErrorBoundary>
    </>
  )
}

export { CourseHeader }