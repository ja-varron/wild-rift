import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, Hash } from "lucide-react"
import type { Student } from "../types"

interface StudentInfoCardsProps {
  student: Student
}

const StudentInfoCards = ({ student }: StudentInfoCardsProps) => {
  const items = [
    { label: "Email", value: student.email, icon: Mail, truncate: true },
    { label: "Mobile", value: student.mobileNumber, icon: Phone, truncate: false },
    { label: "Enrolled Since", value: student.dateAdded, icon: Hash, truncate: false },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="py-4">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950 shrink-0">
              <item.icon className="size-4 text-teal-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-sm font-medium ${item.truncate ? "truncate" : ""}`}>
                {item.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default StudentInfoCards
