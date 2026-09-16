import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/login/LoginPage';
import { RequireAuth } from './services/authentication/RequireAuth';
import ProfilePage from './pages/profile/ProfilePage';
import { RequireRole } from './services/authentication/RequireRole';
import AdminAuthPage from './pages/admin/AdminAuthPage';
import InstructorAuthPage from './pages/instructor/InstructorAuthPage';
import StudentAuthPage from './pages/student/StudentAuthPage';
import { useAuth } from './services/authentication/auth-context';


function RoleRedirect() {
  const { user } = useAuth()
  return <Navigate to={`/${user?.role ?? 'login'}`} replace />
}


const AppRouter = () => {
	return (
		<BrowserRouter>
			<Routes>
				{/* Public pages */}
				<Route path='/' element={<LandingPage />} />
				<Route path='/login' element={<LoginPage />} />

				{/* Authenticated (any role) */}
				<Route element={<RequireAuth />}>
					<Route path='/profile' element={<ProfilePage />} />


					{/* Admin */}
					<Route element={<RequireRole roles={['admin']} />}>
					<Route path='/admin' element={<AdminAuthPage />} />
					</Route>

					{/* Instructor */}
					<Route element={<RequireRole roles={['instructor']} />}>
					<Route path='/instructor' element={<InstructorAuthPage />} />
					</Route>

					{/* Student */}
					<Route element={<RequireRole roles={['student']} />}>
					<Route path='/student' element={<StudentAuthPage />} />
					</Route>

					{/* Catch: send user to their role's home */}
					<Route path='*' element={<RoleRedirect />} />
				</Route>
			</Routes>
		</BrowserRouter>
	)
}

export default AppRouter