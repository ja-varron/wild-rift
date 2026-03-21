import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFetchProfile } from './lib/supabase/authentication/context/use-fetch-profile';
import { Spinner } from './components/ui/spinner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/login/LoginPage';
import AccountVerificationPage from './pages/verification/AccountVerificationPage';
import RequireRole from './components/RequireRole';
import AuthLayout from './layout/AuthLayout';
import StudentDashboardPage from './pages/student/dashboard/StudentDashboardPage';
import StudentExamsPage from './pages/student/exams/StudentExamsPage';
import InstructorDashboardPage from './pages/instructor/dashboard/InstructorDashboardPage';
import InstructorExamsPage from './pages/instructor/exams/InstructorExamsPage';
import InstructorListStudentPage from './pages/instructor/students/InstructorListStudentPage';
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage';
import AdminAccountsPage from './pages/admin/accounts/AdminAccountsPage';
import AdminCoursesPage from './pages/admin/courses/AdminCoursesPage';
import ProfilePage from './pages/profile/ProfilePage';
import { IconClipboardCheckFilled, IconDashboard, IconUsers, IconBook } from '@tabler/icons-react';

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

function getRoleBasedPath(role?: string): string {
  switch (role) {
    case 'instructor': return '/instructor';
    case 'admin': return '/admin';
    case 'student': return '/student';
    default: return '/login';
  }
}

export default function AppRouter() {
  const { authUser, userProfile, isLoading } = useFetchProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner className='size-10' />
      </div>
    );
  }

  const isLoggedIn = !!authUser;
  const userRole = userProfile?.getUserRole?.toLowerCase();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to={getRoleBasedPath(userRole)} replace /> : <LandingPage />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to={getRoleBasedPath(userRole)} replace /> : <LoginPage />} />
        <Route path="/forgot-password" element={isLoggedIn ? <Navigate to={getRoleBasedPath(userRole)} replace /> : <AccountVerificationPage />} />

        {/* Student Routes */}
        <Route path="/student" element={
          <RequireRole allowedRoles={['student']} userProfile={userProfile} isLoading={isLoading}>
            <AuthLayout navigationItems={studentNavigatioItems}>
              <StudentDashboardPage />
            </AuthLayout>
          </RequireRole>
        } />
        <Route path="/student/exams" element={
          <RequireRole allowedRoles={['student']} userProfile={userProfile} isLoading={isLoading}>
            <AuthLayout navigationItems={studentNavigatioItems}>
              <StudentExamsPage />
            </AuthLayout>
          </RequireRole>
        } />

        {/* Instructor Routes */}
        <Route path="/instructor" element={
          <RequireRole allowedRoles={['instructor']} userProfile={userProfile} isLoading={isLoading}>
            <AuthLayout navigationItems={instructorNavigationItems}>
              <InstructorDashboardPage />
            </AuthLayout>
          </RequireRole>
        } />
        <Route path="/instructor/exams" element={
          <RequireRole allowedRoles={['instructor']} userProfile={userProfile} isLoading={isLoading}>
            <AuthLayout navigationItems={instructorNavigationItems}>
              <InstructorExamsPage />
            </AuthLayout>
          </RequireRole>
        } />
        <Route path="/instructor/students" element={
          <RequireRole allowedRoles={['instructor']} userProfile={userProfile} isLoading={isLoading}>
            <AuthLayout navigationItems={instructorNavigationItems}>
              <InstructorListStudentPage />
            </AuthLayout>
          </RequireRole>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <RequireRole allowedRoles={['admin']} userProfile={userProfile} isLoading={isLoading}>
            <AuthLayout navigationItems={adminNavigationItems}>
              <AdminDashboardPage />
            </AuthLayout>
          </RequireRole>
        } />
        <Route path="/admin/accounts" element={
          <RequireRole allowedRoles={['admin']} userProfile={userProfile} isLoading={isLoading}>
            <AuthLayout navigationItems={adminNavigationItems}>
              <AdminAccountsPage />
            </AuthLayout>
          </RequireRole>
        } />
        <Route path="/admin/courses" element={
          <RequireRole allowedRoles={['admin']} userProfile={userProfile} isLoading={isLoading}>
            <AuthLayout navigationItems={adminNavigationItems}>
              <AdminCoursesPage />
            </AuthLayout>
          </RequireRole>
        } />

        {/* Profile Page (accessible to all authenticated users) */}
        <Route path="/profile" element={
          isLoggedIn ? (
            <AuthLayout navigationItems={
              userRole === 'admin' ? adminNavigationItems :
              userRole === 'instructor' ? instructorNavigationItems :
              studentNavigatioItems
            }>
              <ProfilePage />
            </AuthLayout>
          ) : <Navigate to="/login" />
        } />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
