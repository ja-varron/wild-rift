import { cn } from "@/lib/utils"
import { Card, CardContent } from "../ui/card"

type SummaryStats = {
  label: string
  value: string
  sub: string
  color?: string
  icon?: React.ComponentType<{ className?: string }>
}

const SummaryStatsCard = ({ stats }: { stats: SummaryStats }) => {
  return (
    <Card className="py-5 shadow-sm transition-colors hover:border-teal-200">
      <CardContent className="px-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">{stats.label}</p>
            <p className={cn("text-3xl font-bold tracking-tight", stats.color)}>{stats.value}</p>
            {stats.sub ? <p className="text-xs text-muted-foreground">{stats.sub}</p> : null}
          </div>
          <div className="flex size-9 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
            {stats.icon ? <stats.icon className="size-5 text-teal-700" /> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { SummaryStatsCard }