import { useState, useMemo, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, LinkIcon, Trash2, Loader2 } from "lucide-react"
import { useFetchUsers } from "@/lib/supabase/authentication/context/use-fetch-users"
import { useAssignStudentToInstructor, useRemoveStudentFromInstructor } from "@/lib/supabase/enrollment/use-enrollment-mutations"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ── Component ──────────────────────────────────────────────────────────────────

const AdminAssignmentsPage = () => {
  const { users, isLoading: usersLoading } = useFetchUsers()
  
  // Get students and instructors from users list
  const students = useMemo(() => users.filter(u => u.getUserRole === "Student"), [users])
  const instructors = useMemo(() => users.filter(u => u.getUserRole === "Instructor"), [users])
  
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"students" | "instructors">("students")
  
  // Assignment dialogs
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [removingData, setRemovingData] = useState<{ studentId: string; instructorId: string } | null>(null)
  
  // Store instructor->students map and student->instructors map
  const [instructorStudentsMap, setInstructorStudentsMap] = useState<Map<string, string[]>>(new Map())
  const [studentInstructorsMap, setStudentInstructorsMap] = useState<Map<string, string[]>>(new Map())

  const fetchAssignmentMappings = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
      const response = await fetch(`${backendUrl}/api/assignments/mappings`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to fetch assignment mappings")
      }

      const mappings = Array.isArray(payload?.mappings) ? payload.mappings : []
      const newMap = new Map<string, string[]>()
      const newStudentMap = new Map<string, string[]>()

      mappings.forEach((row: { instructor_id: string; student_id: string }) => {
        if (!row?.instructor_id || !row?.student_id) return

        const instructorList = newMap.get(row.instructor_id) || []
        instructorList.push(row.student_id)
        newMap.set(row.instructor_id, instructorList)

        const studentList = newStudentMap.get(row.student_id) || []
        studentList.push(row.instructor_id)
        newStudentMap.set(row.student_id, studentList)
      })

      setInstructorStudentsMap(newMap)
      setStudentInstructorsMap(newStudentMap)
    } catch (error) {
      console.error("Failed to fetch assignment mappings", error)
    }
  }
  
  // Mutations
  const assignMutation = useAssignStudentToInstructor()
  const removeMutation = useRemoveStudentFromInstructor()
  
  // Fetch all assignment mappings
  useEffect(() => {
    fetchAssignmentMappings()
  }, [instructors.length])
  
  // ── Filtered lists ──
  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      `${s.getFirstName} ${s.getLastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.getEmailAddress.toLowerCase().includes(search.toLowerCase())
    )
  }, [students, search])
  
  const filteredInstructors = useMemo(() => {
    return instructors.filter(i =>
      `${i.getFirstName} ${i.getLastName}`.toLowerCase().includes(search.toLowerCase()) ||
      i.getEmailAddress.toLowerCase().includes(search.toLowerCase())
    )
  }, [instructors, search])
  
  // ── Get student's instructors ──
  const StudentInstructorsList = ({ studentId }: { studentId: string }) => {
    const assignedInstructorIds = studentInstructorsMap.get(studentId) || []
    const assignedInstructors = instructors.filter(i => assignedInstructorIds.includes(i.getUserId))
    
    return (
      <div className="flex flex-wrap gap-1">
        {assignedInstructors.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">No instructors assigned</span>
        ) : (
          assignedInstructors.map(instructor => (
            <Badge key={instructor.getUserId} variant="outline" className="text-xs">
              {instructor.getFirstName} {instructor.getLastName}
            </Badge>
          ))
        )}
      </div>
    )
  }
  
  // ── Get instructor's students ──
  const InstructorStudentsList = ({ instructorId }: { instructorId: string }) => {
    const assignedStudentIds = instructorStudentsMap.get(instructorId) || []
    const assignedStudents = students.filter(s => assignedStudentIds.includes(s.getUserId))
    
    return (
      <div className="text-sm">
        {assignedStudents.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">No students assigned</span>
        ) : (
          <div className="space-y-1">
            {assignedStudents.map(student => (
              <div key={student.getUserId} className="flex items-center justify-between px-2 py-1 rounded bg-muted/50">
                <span className="text-xs">{student.getFirstName} {student.getLastName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setRemovingData({ studentId: student.getUserId, instructorId })
                    setRemoveDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // ── Handlers ──
  const handleAssign = async () => {
    if (!selectedStudentId || !selectedInstructorId) {
      toast.error("Please select both a student and an instructor")
      return
    }
    
    assignMutation.mutate(
      { studentId: selectedStudentId, instructorId: selectedInstructorId },
      {
        onSuccess: () => {
          toast.success(`Student assigned successfully`)
          setSelectedStudentId("")
          setSelectedInstructorId("")
          fetchAssignmentMappings()
        },
        onError: (error: unknown) => {
          const maybeError = error as { code?: string }
          if (maybeError.code === "23505") {
            toast.error("This student is already assigned to this instructor")
          } else {
            toast.error("Failed to assign student")
          }
        },
      }
    )
  }
  
  const handleRemove = async () => {
    if (!removingData) return
    
    removeMutation.mutate(
      { studentId: removingData.studentId, instructorId: removingData.instructorId },
      {
        onSuccess: () => {
          toast.success("Student removed from instructor successfully")
          setRemoveDialogOpen(false)
          setRemovingData(null)
          fetchAssignmentMappings()
        },
        onError: () => {
          toast.error("Failed to remove student")
        },
      }
    )
  }
  
  if (usersLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }
  
  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold">Student-Instructor Assignments</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage which students are assigned to which instructors. Students automatically appear in all exams created by their assigned instructors.
          </p>
        </div>
        
        {/* Assignment card */}
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Assign Student to Instructor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Student</label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.getUserId} value={s.getUserId}>
                          {s.getFirstName} {s.getLastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Instructor selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instructor</label>
                  <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an instructor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map(i => (
                        <SelectItem key={i.getUserId} value={i.getUserId}>
                          {i.getFirstName} {i.getLastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                onClick={handleAssign}
                disabled={assignMutation.isPending || !selectedStudentId || !selectedInstructorId}
                className="w-full"
              >
                {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {assignMutation.isPending ? "Assigning..." : "Assign Student"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* View toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "students" ? "default" : "outline"}
            onClick={() => setViewMode("students")}
          >
            View by Student
          </Button>
          <Button
            variant={viewMode === "instructors" ? "default" : "outline"}
            onClick={() => setViewMode("instructors")}
          >
            View by Instructor
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={viewMode === "students" ? "Search students..." : "Search instructors..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* View by Student */}
        {viewMode === "students" && (
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold">
                Students ({filteredStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Assigned Instructors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map(student => (
                        <TableRow key={student.getUserId}>
                          <TableCell className="font-medium">
                            {student.getFirstName} {student.getLastName}
                          </TableCell>
                          <TableCell className="text-sm">{student.getEmailAddress}</TableCell>
                          <TableCell>
                            <StudentInstructorsList studentId={student.getUserId} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* View by Instructor */}
        {viewMode === "instructors" && (
          <div className="space-y-4">
            {filteredInstructors.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    No instructors found
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredInstructors.map(instructor => (
                <Card key={instructor.getUserId}>
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-base font-semibold">
                      {instructor.getFirstName} {instructor.getLastName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{instructor.getEmailAddress}</p>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Assigned Students</h4>
                      <InstructorStudentsList instructorId={instructor.getUserId} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
      
      {/* Remove confirmation dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Remove Student Assignment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this student from the instructor? The student will no longer be enrolled in their new exams.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  )
}

export default AdminAssignmentsPage
