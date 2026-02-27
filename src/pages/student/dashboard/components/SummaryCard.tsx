import { Card, CardContent } from "@/components/ui/card";

interface SummaryStat {
  label: string
  value: string
  color?: string
  sub?: string
}

const SummaryCard = ({ stat }: { stat: SummaryStat }) => {
  return (
    <Card key={stat.label} className="py-5">
      <CardContent className="px-5 space-y-1">
        <p className="text-sm text-muted-foreground">{stat.label}</p>
        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
        {stat.sub && <p className="text-xs text-muted-foreground">{stat.sub}</p>}
      </CardContent>
    </Card>
  )
}

export { SummaryCard }