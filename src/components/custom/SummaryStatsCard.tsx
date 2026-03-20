import { Card, CardContent } from "../ui/card"

type SummaryStats = {
  label: string
  value: string
  sub: string
  icon?: React.ComponentType<{ className?: string }>
}

const SummaryStatsCard = ({ stats }: { stats: SummaryStats }) => {
  return (
    <Card className="py-5">
      <CardContent className="px-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{stats.label}</p>
            <p className="text-3xl font-bold">{stats.value}</p>
            <p className="text-xs text-muted-foreground">{stats.sub}</p>
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