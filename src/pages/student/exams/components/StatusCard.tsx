import { Card, CardContent } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"

interface StatusCardProps {
  cardName: string
  value: string | number
  icon: LucideIcon
  iconBg?: string
  iconColor?: string
  valueColor?: string
}

const StatusCard = ({ cardName, value, icon: Icon, iconBg, iconColor, valueColor }: StatusCardProps) => {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 px-5 py-5">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconBg ?? "bg-teal-50 dark:bg-teal-950/30"}`}>
          <Icon className={`size-5 ${iconColor ?? "text-teal-700"}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{cardName}</p>
          <p className={`text-2xl font-bold ${valueColor ?? ""}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export { StatusCard }