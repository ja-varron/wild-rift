import { type ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  children: ReactNode
  cardTitle: string
  cardDescription?: string
  contentClassName?: string
}

const ChartCard = ({ children, cardTitle, cardDescription, contentClassName }: ChartCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">{cardTitle}</CardTitle>
          {cardDescription && (
            <CardDescription className="text-xs sm:text-sm">{cardDescription}</CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn("pt-4 px-2 sm:px-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

export { ChartCard }