import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react"
import type { Student } from "../types"
import { initials } from "../types"

interface StudentDetailHeaderProps {
  student: Student
  onBack: () => void
}

const StudentDetailHeader = ({ student, onBack }: StudentDetailHeaderProps) => {
  return (
    <div className="flex items-start gap-4">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 mt-0.5"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
      </Button>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Avatar className="size-14 border-2 border-border shrink-0">
          <AvatarFallback className="text-lg font-bold bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
            {initials(student.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{student.name}</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            {student.examineeNo} · {student.course} · {student.yearLevel}
          </p>
        </div>
      </div>
    </div>
  )
}

export default StudentDetailHeader
