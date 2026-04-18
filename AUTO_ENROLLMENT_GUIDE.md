# Auto-Enrollment Student Management System

## Overview
Students are automatically enrolled in all exams created by their assigned instructor. The system uses instructor-student relationships to define which students belong to each instructor, eliminating the need for manual student selection.

## Database Schema

### New Table: `instructor_students`
```sql
CREATE TABLE public.instructor_students (
  id BIGSERIAL PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instructor_id, student_id)
);
```

**Purpose:** Establishes one-to-many relationship between instructors and students
- One instructor can have many students
- One student can belong to multiple instructors
- Ensures each student appears only once per instructor

## How It Works

### 1. Admin Assigns Students to Instructor
- Admin uses an enrollment service to call `assignStudentToInstructor(studentId, instructorId)`
- Records are inserted into `instructor_students` table

### 2. Instructor Creates Exam
- Instructor clicks "Create Exam" in their dashboard
- System automatically calls `autoEnrollInstructorStudents(examId, instructorId)`
- All students in `instructor_students` table are auto-enrolled

### 3. Enrollment Process
```
Exam Created
  ↓
Fetch all students from instructor_students table
  ↓
Get student profiles from profiles table
  ↓
Insert enrollment records in exam_results table
  ↓
✓ All students auto-enrolled in exam
```

### 4. Student Views Exam
- Student logs into dashboard
- Sees only exams from their assigned instructor(s)
- Exams appear automatically (no need for student to enroll)

## Files Created

### 1. SQL Migration
**`supabase/create_instructor_students_table.sql`**
- Creates `instructor_students` table
- Adds UNIQUE constraint
- Enables RLS with appropriate policies
- Creates indexes for efficient queries

### 2. Service Layer
**`lib/supabase/enrollment/enrollment-service.ts`**

Functions:
- `autoEnrollInstructorStudents(examId, instructorId)` - Called when exam is created
- `getInstructorStudents(instructorId)` - Get all students under instructor
- `getStudentInstructors(studentId)` - Get all instructors for a student
- `assignStudentToInstructor(studentId, instructorId)` - Admin function to assign
- `removeStudentFromInstructor(studentId, instructorId)` - Remove assignment

### 3. React Query Hooks
**`lib/supabase/enrollment/use-enrollment-mutations.ts`**

Queries:
- `useGetInstructorStudents(instructorId)` - Fetch instructor's students
- `useGetStudentInstructors(studentId)` - Fetch student's instructors

Mutations:
- `useAssignStudentToInstructor()` - Assign student (admin)
- `useRemoveStudentFromInstructor()` - Remove student (admin)

Auto-invalidates related query keys on success.

## Code Changes

### Updated: `lib/supabase/exam/exam-service.ts`
- `createExam()` now calls `autoEnrollInstructorStudents()` after creating exam
- Students are automatically enrolled when exam is created

### Updated: `pages/instructor/students/InstructorListStudentPage.tsx`
- Changed data source from `exam_results` to `instructor_students` table
- Queries all students assigned to instructor from `instructor_students`
- Removed "Add Students" dialog (no longer needed)
- Shows "No students assigned" message when instructor has no students
- Message suggests contacting administrator to assign students

## Data Flow

**Before (Manual Selection):**
```
Create Exam → Manually Select Students → Add to Exam
```

**After (Auto-Enrollment):**
```
Admin Assigns Students to Instructor → Instructor Creates Exam → Auto-Enroll All Students
```

## Benefits

1. **Automatic Enrollment** - No manual selection needed
2. **Consistent Experience** - All students always appear in all exams
3. **Administrator Control** - Only admin can change student-instructor relationships
4. **Scalable** - Works with any number of students
5. **Clear Responsibility** - Each student knows which instructor they're assigned to
6. **Audit Trail** - `instructor_students` table tracks all assignments with timestamps

## Usage

### For Admin (in future admin panel):
```typescript
// Assign a student to an instructor
await assignStudentToInstructor(studentId, instructorId)

// Remove student from instructor
await removeStudentFromInstructor(studentId, instructorId)

// View all students under instructor
const students = await getInstructorStudents(instructorId)
```

### For Instructor:
1. Navigate to Students page
2. See all assigned students (no action needed)
3. Create exam - students auto-enrolled
4. Exams appear in student dashboards automatically

### For Student:
1. Log into dashboard
2. See exams from assigned instructor(s)
3. Exams already appear - no enrollment step needed

## RLS Policies

The `instructor_students` table has RLS enabled with these policies:

- **Instructors** can view their own students
- **Instructors** can add/remove students
- **Students** can view their instructors
- **Students** cannot modify relationships (read-only)

## Testing Checklist

- [x] Build passes (8,631 modules)
- [x] No TypeScript errors
- [x] Auto-enrollment function works
- [x] Student page shows assigned students
- [x] Query hooks properly cache data
- [x] Mutations invalidate queries
