import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from '@/pages/login/LoginPage'
import AccountVerificationPage from '@/pages/verification/AccountVerificationPage'
import LandingPage from '@/pages/LandingPage'
import StudentDashboardPage from './pages/student/dashboard/StudentDashboardPage'
import StudentAnalyticsPage from './pages/student/exams/StudentExamsPage'
import InstructorDashboardPage from './pages/instructor/dashboard/InstructorDashboardPage'
import InstructorExamsPage from './pages/instructor/exams/InstructorExamsPage'
import InstructorListStudentPage from './pages/instructor/students/InstructorListStudentPage'
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage'
import AdminAccountsPage from './pages/admin/accounts/AdminAccountsPage'
import AdminCoursesPage from './pages/admin/courses/AdminCoursesPage'
import AuthLayout from './layout/AuthLayout'
import ProfilePage from './pages/profile/ProfilePage'
import { IconClipboardCheckFilled, IconDashboard, IconUsers, IconBook } from '@tabler/icons-react'

const studentNavigatioItems = [
  { label: "Dashboard", icon: IconDashboard, path: "/student" },
  { label: "My Exams", icon: IconClipboardCheckFilled, path: "/student/exams" },
]

const instructorNavigationItems = [
  { label: "Dashboard", icon: IconDashboard, path: "/instructor" },
  { label: "Exams", icon: IconClipboardCheckFilled, path: "/instructor/exams" },
  { label: "Students", icon: IconUsers, path: "/instructor/students" },
]

const adminNavigationItems = [
  { label: "Dashboard", icon: IconDashboard, path: "/admin" },
  { label: "Accounts", icon: IconUsers, path: "/admin/accounts" },
  { label: "Courses", icon: IconBook, path: "/admin/courses" },
]

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<AccountVerificationPage />} />

        {/* Routes for student */}
        <Route path="/student" element={<AuthLayout navigationItems={studentNavigatioItems}><StudentDashboardPage /></AuthLayout>} />
        <Route path="/student/exams" element={<AuthLayout navigationItems={studentNavigatioItems}><StudentAnalyticsPage /></AuthLayout>} />
        <Route path="/profile" element={<AuthLayout navigationItems={studentNavigatioItems}><ProfilePage /></AuthLayout>} />

        {/* Routes for instructor */}
        <Route path="/instructor" element={<AuthLayout navigationItems={instructorNavigationItems}><InstructorDashboardPage /></AuthLayout>} />
        <Route path="/instructor/exams" element={<AuthLayout navigationItems={instructorNavigationItems}><InstructorExamsPage /></AuthLayout>} />
        <Route path="/instructor/students" element={<AuthLayout navigationItems={instructorNavigationItems}><InstructorListStudentPage /></AuthLayout >} />

        {/* Routes for admin */}
        <Route path="/admin" element={<AuthLayout navigationItems={adminNavigationItems}><AdminDashboardPage /></AuthLayout>} />
        <Route path="/admin/accounts" element={<AuthLayout navigationItems={adminNavigationItems}><AdminAccountsPage /></AuthLayout>} />
        <Route path="/admin/courses" element={<AuthLayout navigationItems={adminNavigationItems}><AdminCoursesPage /></AuthLayout>} />
      </Routes>
    </Router>
  )
}

export default App
