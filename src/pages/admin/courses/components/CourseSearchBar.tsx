import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"

interface CourseSearchBarProps {
  value: string
  onChange: (value: string) => void
}

const CourseSearchBar = ({ value, onChange }: CourseSearchBarProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search examinations, subjects, or topics..."
            className="pl-9"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default CourseSearchBar
