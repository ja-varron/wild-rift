import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useFetchProfile } from './lib/supabase/authentication/context/use-fetch-profile';
import { Spinner } from './components/ui/spinner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/login/LoginPage';
import AccountRequestPage from './pages/login/AccountRequestPage';
import AccountVerificationPage from './pages/verification/AccountVerificationPage';
import ForcePasswordChangePage from './pages/verification/ForcePasswordChangePage';
import RequireRole from './components/RequireRole';
import AuthLayout from './layout/AuthLayout';
import StudentDashboardPage from './pages/student/dashboard/StudentDashboardPage';
import StudentExamsPage from './pages/student/exams/StudentExamsPage';
import StudentExamDetailsPage from './pages/student/exams/StudentExamDetailsPage';
import InstructorDashboardPage from './pages/instructor/dashboard/InstructorDashboardPage';
import InstructorExamsPage from './pages/instructor/exams/InstructorExamsPage';
import InstructorListStudentPage from './pages/instructor/students/InstructorListStudentPage';
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage';
import AdminAccountsPage from './pages/admin/accounts/AdminAccountsPage';
import AdminLicensureExamsPage from './pages/admin/licensure-exams/AdminLicensureExamsPage';
import ProfilePage from './pages/profile/ProfilePage';
import { IconClipboardCheckFilled, IconDashboard, IconUsers, IconCertificate } from '@tabler/icons-react';
import { isSupabaseConfigured } from './lib/supabase/supabase';
import { UserProfile } from './model/user-profile';
import type { ReactNode } from 'react';
import type { NavigationItem } from './components/custom/navigation-item';

const studentNavigatioItems: NavigationItem[] = [
  { label: "Dashboard", icon: IconDashboard, path: "/student" },
  { label: "My Exams", icon: IconClipboardCheckFilled, path: "/student/exams" },
]

const instructorNavigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: IconDashboard, path: "/instructor" },
  { label: "Exams", icon: IconClipboardCheckFilled, path: "/instructor/exams" },
  { label: "Students", icon: IconUsers, path: "/instructor/students" },
]

const adminNavigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: IconDashboard, path: "/admin" },
  { label: "Accounts", icon: IconUsers, path: "/admin/accounts" },
  { label: "PRC Licensure Exams", icon: IconCertificate, path: "/admin/licensure-exams" },
]

function getRoleBasedPath(role?: string): string {
  switch (role) {
    case 'instructor': return '/instructor';
    case 'admin': return '/admin';
    case 'student': return '/student';
    default: return '/student';
  }
}

const ProtectedRoute = ({
  allowedRoles,
  userProfile,
  isLoading,
  children,
  navItems,
}: {
  allowedRoles: string[];
  userProfile: UserProfile | null | undefined;
  isLoading: boolean;
  children: ReactNode;
  navItems: NavigationItem[];
}) => (
  <RequireRole allowedRoles={allowedRoles} userProfile={userProfile} isLoading={isLoading}>
    <AuthLayout navigationItems={navItems}>
      {children}
    </AuthLayout>
  </RequireRole>
);

function ConfiguredAppRouter() {
  const { authUser, userProfile, isLoading } = useFetchProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner className='size-10' />
      </div>
    );
  }

  const isLoggedIn = !!authUser;
  const needsPasswordChange = authUser?.user_metadata?.force_password_change === true;
  const rawUserRole = userProfile?.getUserRole?.toLowerCase();
  const userRole = rawUserRole === 'admin' || rawUserRole === 'instructor' || rawUserRole === 'student'
    ? rawUserRole
    : (isLoggedIn ? 'student' : undefined);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to={needsPasswordChange ? '/force-password-change' : getRoleBasedPath(userRole)} replace /> : <LandingPage />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to={needsPasswordChange ? '/force-password-change' : getRoleBasedPath(userRole)} replace /> : <LoginPage />} />
        <Route path="/account-request" element={isLoggedIn ? <Navigate to={needsPasswordChange ? '/force-password-change' : getRoleBasedPath(userRole)} replace /> : <AccountRequestPage />} />
        <Route path="/forgot-password" element={isLoggedIn ? <Navigate to={getRoleBasedPath(userRole)} replace /> : <AccountVerificationPage />} />
        <Route
          path="/force-password-change"
          element={
            isLoggedIn
              ? (needsPasswordChange ? <ForcePasswordChangePage /> : <Navigate to={getRoleBasedPath(userRole)} replace />)
              : <Navigate to="/login" replace />
          }
        />

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            needsPasswordChange
              ? <Navigate to="/force-password-change" replace />
              : (
                <ProtectedRoute allowedRoles={['student']} userProfile={userProfile} isLoading={isLoading} navItems={studentNavigatioItems}>
                  <Outlet />
                </ProtectedRoute>
              )
          }
        >
          <Route index element={<StudentDashboardPage />} />
          <Route path="exams" element={<StudentExamsPage />} />
          <Route path="exams/:id" element={<StudentExamDetailsPage />} />
        </Route>

        {/* Instructor Routes */}
        <Route
          path="/instructor"
          element={
            needsPasswordChange
              ? <Navigate to="/force-password-change" replace />
              : (
                <ProtectedRoute allowedRoles={['instructor']} userProfile={userProfile} isLoading={isLoading} navItems={instructorNavigationItems}>
                  <Outlet />
                </ProtectedRoute>
              )
          }
        >
          <Route index element={<InstructorDashboardPage />} />
          <Route path="exams" element={<InstructorExamsPage />} />
          <Route path="students" element={<InstructorListStudentPage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            needsPasswordChange
              ? <Navigate to="/force-password-change" replace />
              : (
                <ProtectedRoute allowedRoles={['admin']} userProfile={userProfile} isLoading={isLoading} navItems={adminNavigationItems}>
                  <Outlet />
                </ProtectedRoute>
              )
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="licensure-exams" element={<AdminLicensureExamsPage />} />
          <Route path="accounts" element={<AdminAccountsPage />} />
        </Route>

        {/* Profile Page (accessible to all authenticated users) */}
        <Route path="/profile" element={
          isLoggedIn ? (
            needsPasswordChange
              ? <Navigate to="/force-password-change" replace />
              : (
                <AuthLayout navigationItems={
                  userRole === 'admin' ? adminNavigationItems :
                  userRole === 'instructor' ? instructorNavigationItems :
                  studentNavigatioItems
                }>
                  <ProfilePage />
                </AuthLayout>
              )
          ) : <Navigate to="/login" />
        } />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function AppRouter() {
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-xl rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Missing Supabase configuration</h1>
          <p className="mt-2 text-sm text-slate-600">
            Set either VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY, in your local environment file and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return <ConfiguredAppRouter />;
}
