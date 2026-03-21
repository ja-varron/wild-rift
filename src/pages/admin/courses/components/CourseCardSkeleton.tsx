import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const CourseCardSkeleton = () => {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-7 w-7" />
                <Skeleton className="h-7 w-7" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default CourseCardSkeleton
