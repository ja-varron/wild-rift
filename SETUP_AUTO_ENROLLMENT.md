# Auto-Enrollment System - Setup & Usage Guide

## 🔧 Setup Instructions

### 1. Create the Database Table
Run the SQL migration in your Supabase console:

```sql
-- File: supabase/create_instructor_students_table.sql
--
-- Creates instructor_students table with RLS policies
```

**Location:** `wild-rift/supabase/create_instructor_students_table.sql`

**Steps:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy-paste the entire SQL file
5. Execute

**Result:** `instructor_students` table created with:
-FK to `auth.users` (instructor_id)
- FK to `auth.users` (student_id)
- UNIQUE constraint to prevent duplicates
- RLS enabled with 4 policies

### 2. Build the Application
```bash
cd wild-rift
npm run build
```

✅ Should complete with 8,631 modules transformed, zero errors

---

## 👥 User Workflows

### For Admin: Assign Students to Instructor

**Scenario:** Admin needs to assign 5 students to Instructor Dr. Smith

**Technical Implementation:**
```typescript
// In a future admin panel, use:
import { assignStudentToInstructor } from '@/lib/supabase/enrollment/enrollment-service'

// Assign each student:
await assignStudentToInstructor(studentId, instructorId)

// This creates a record in instructor_students table:
// instructorId | studentId | created_at
```

**Database Result:**
```sql
INSERT INTO instructor_students (instructor_id, student_id)
VALUES ('prof-smith-uuid', 'student-john-uuid')
```

---

### For Instructor: Create Exam with Auto-Enrolled Students

**Scenario:** Dr. Smith creates a new Mathematics exam

**Step 1: Create Exam**
- Go to Instructor Dashboard → Exams → Create Exam
- Fill form:
  - Exam Title: "Midterm Exam"
  - Course: "MAT101"
  - Exam Date: "2026-04-15"
  - Topics: "Algebra, Geometry, Calculus"
  - Total Items: 100
  - Passing Rate: 70%

**Step 2: System Automatically:**
```typescript
// In exam-service.ts createExam():
1. Create exam record in 'exams' table
2. Get exam ID
3. Call autoEnrollInstructorStudents(examId, instructorId)
   ├─ Fetch all students from instructor_students table
   ├─ Get their profiles
   └─ Insert records in exam_results table
```

**Database Result:**
```sql
-- exams table
INSERT INTO exams (instructor_id, exam_title, course_id, ...)
VALUES ('prof-smith-uuid', 'Midterm Exam', 'MAT101', ...)
-- Returns: exam_id = 42

-- exam_results table (auto-inserted)
INSERT INTO exam_results (exam_id, student_id, student_name, ...)
VALUES 
  (42, 'student-alice-uuid', 'Alice Johnson', ...),
  (42, 'student-bob-uuid', 'Bob Smith', ...),
  (42, 'student-carol-uuid', 'Carol White', ...),
  ... (all 5 students)
```

**Step 3: View Students**
- Go to Students page
- See all 5 students listed (they were auto-enrolled)

---

### For Student: See Exams in Dashboard

**Scenario:** Alice (student) logs into her dashboard

**What Happens:**
```typescript
// In StudentDashboardPage:
1. Get current user (Alice)
2. Query instructor_students table
   └─ Find all instructors where Alice is a student
3. Query exams table
   └─ Show all exams from those instructors
4. Display in "Upcoming Exams" section
```

**Student Sees:**
```
Upcoming Exams from Dr. Smith:
  ✓ Midterm Exam (MAT101) - April 15, 2026
    Topics: Algebra, Geometry, Calculus
    
(Already enrolled, no action needed)
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN SIDE                                │
│  Assigns Students to Instructor                             │
│  → instructor_students table                                │
│  [instructorId: prof-smith, studentId: alice]             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│               INSTRUCTOR CREATES EXAM                        │
│  "Create Exam" button                                       │
│  → createExam() called                                      │
│  → autoEnrollInstructorStudents() called                    │
│  → All students auto-enrolled                              │
│  → exam_results records created for each student          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              STUDENT SEES EXAM                              │
│  Exam appears in student dashboard                         │
│  (Already enrolled, no click-to-enroll needed)            │
│  Student takes exam → Results recorded                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### instructor_students
```sql
id                BIGSERIAL PRIMARY KEY
instructor_id     UUID (FK to auth.users)
student_id        UUID (FK to auth.users)
created_at        TIMESTAMP
UNIQUE(instructor_id, student_id)
```

### exam_results (pre-populated on exam creation)
```sql
exam_id           BIGINT (FK to exams)
student_id        UUID (pre-filled from instructor_students)
student_name      VARCHAR (pre-filled from profiles)
score             NUMERIC (NULL until exam taken)
total_items       INTEGER
passed            BOOLEAN
... (other fields)
```

---

## 🔐 RLS Policies

| Table | User | SELECT | INSERT | UPDATE | DELETE |
|-------|------|--------|--------|--------|--------|
| instructor_students | Instructor | Can view own students | Can assign | ✗ | Can unassign |
| instructor_students | Student | Can view own instructors | ✗ | ✗ | ✗ |
| exam_results | Admin/All | ✓ | ✓ (auto on exam create) | ✓ | ✓ |
| exams | Instructor | Can view own | Can create | Can update own | Can delete own |

---

## 🚀 Service Functions Reference

### Auto-Enrollment
```typescript
// Automatically called when exam created
autoEnrollInstructorStudents(examId, instructorId)
  → Returns: { success, enrolledCount, error? }
```

### Admin Functions
```typescript
// Assign student to instructor
assignStudentToInstructor(studentId, instructorId)

// Remove student from instructor
removeStudentFromInstructor(studentId, instructorId)

// Get all students for an instructor
getInstructorStudents(instructorId)
  → Returns: Array of student profiles
```

### Query Functions
```typescript
// Get instructors for a student
getStudentInstructors(studentId)
  → Returns: Array of instructor profiles
```

### React Query Hooks
```typescript
// Fetch instructor's students
const { data: students } = useGetInstructorStudents(instructorId)

// Fetch student's instructors
const { data: instructors } = useGetStudentInstructors(studentId)

// Assign student (mutation)
const assignMutation = useAssignStudentToInstructor()
await assignMutation.mutateAsync({ studentId, instructorId })

// Remove student (mutation)
const removeMutation = useRemoveStudentFromInstructor()
await removeMutation.mutateAsync({ studentId, instructorId })
```

---

## ✅ Verification Checklist

- [x] Build passes (8,631 modules, 0 errors)
- [ ] SQL migration executed in Supabase
- [ ] `instructor_students` table exists with RLS
- [ ] Admin can assign students (via Supabase UI)
- [ ] Instructor creates exam → students auto-enrolled
- [ ] Student sees exam in dashboard
- [ ] Exam results appear after student takes exam

---

## 🐛 Troubleshooting

### "No students assigned to you yet"
**Cause:** No records in `instructor_students` table for this instructor
**Fix:** Admin needs to assign students to instructor

### Auto-enrollment not working
**Check:**
1. SQL migration executed?
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'instructor_students'
   ```
2. Students in `instructor_students` for this instructor?
   ```sql
   SELECT * FROM instructor_students 
   WHERE instructor_id = 'your-instructor-id'
   ```
3. Check function logs in browser console

### Duplicate enrollments
**Cause:** Exams created before SQL migration might not have auto-enrollment
**Fix:** Manually insert exam_results records for existing exams:
```sql
INSERT INTO exam_results (exam_id, student_id, student_name, ...)
SELECT exam_id, is.student_id, p.first_name || ' ' || p.last_name
FROM instructor_students is
JOIN profiles p ON is.student_id = p.user_id
WHERE is.instructor_id = 'instructor-id'
```
