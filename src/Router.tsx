import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/login/LoginPage';
import { Layout } from './layout/Layout';
import CourseOverview from './pages/overview/CourseOverview';
import CoursePage from './pages/course/CoursePage';
import ExamPage from './pages/course/exam/ExamPage';
import AdminPage from './pages/admin/AdminPage';
import RegisterPage from './pages/register/RegisterPage';
import { OTPPage } from './pages/register/otp/OTPPage';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <Layout>
          <LoginPage />
        </Layout>
      } />

      <Route path="/register" element={
        <Layout>
          <RegisterPage />
        </Layout>
      } />

      <Route path="/register/otp" element={
        <Layout>
          <OTPPage />
        </Layout>
      } />

      <Route path="/overview" element={
        <Layout isAuthenticated={true}>
          <CourseOverview />
        </Layout>
      } />

      <Route path='/course' element={
        <Layout isAuthenticated={true}>
          <CoursePage />
        </Layout>
      } />

      <Route path='/course/exam' element={
        <Layout isAuthenticated={true}>
          <ExamPage />
        </Layout>
      } />

      <Route path='/admin' element={
        <Layout isAuthenticated={true}>
          <AdminPage />
        </Layout>
      } />

    </Routes>
  )
}

export default AppRouter