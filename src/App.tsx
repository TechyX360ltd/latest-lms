import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { ResetPasswordPage } from './components/Auth/ResetPasswordPage';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { LearnerDashboard } from './components/Learner/Dashboard';
import { CourseList } from './components/Learner/CourseList';
import { BrowseCourses } from './components/Learner/BrowseCourses';
import { CourseViewer } from './components/Learner/CourseViewer';
import { Certificates } from './components/Learner/Certificates';
import { Progress } from './components/Learner/Progress';
import { Profile } from './components/Learner/Profile';
import { LearnerNotificationCenter } from './components/Learner/NotificationCenter';
import AdminOverview from './components/Admin/Overview';
import { UserManagement } from './components/Admin/UserManagement';
import { CourseManagement } from './components/Admin/CourseManagement';
import { SchoolManagement } from './components/Admin/SchoolManagement';
import { ProgressTracking } from './components/Admin/ProgressTracking';
import { NotificationCenter } from './components/Admin/NotificationCenter';
import { CertificatePreview } from './components/Admin/CertificatePreview';
import { Analytics } from './components/Admin/Analytics';
import { Settings } from './components/Admin/Settings';
import { PaymentManagement } from './components/Admin/PaymentManagement';
import { SupabaseConnectionStatus } from './components/SupabaseConnectionStatus';
import InstructorProfile from './components/Instructor/InstructorProfile';
import { InstructorDashboard } from './components/Instructor/InstructorDashboard';
import { ToastProvider } from './components/Auth/ToastContext';
import { CategoryManagement } from './components/Admin/CategoryManagement';
import { AdminProfile } from './components/Admin/AdminProfile';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { InstructorProfilePage } from './components/Learner/InstructorProfilePage';
import LearnerCalendarPage from './pages/LearnerCalendarPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminScheduleSessionPage from './pages/AdminScheduleSessionPage';
import { GamificationDashboard } from './components/Gamification/GamificationDashboard';
import { StoreManagement } from './components/Admin/StoreManagement';
import { BadgeManagement } from './components/Admin/BadgeManagement';
import { GamificationModeration } from './components/Admin/GamificationModeration';
import { CouponManagement } from './components/Admin/CouponManagement';
import { RatingManagement } from './components/Admin/RatingManagement';
import { RatingTest } from './components/Admin/RatingTest';
import { AdminSidebar } from './components/Admin/Sidebar';
import ReferralsPage from './pages/ReferralsPage';
import AdminReferralsPage from './pages/AdminReferralsPage';
import { CertificateVerificationPage } from './pages/CertificateVerificationPage';
import CertificatePage from './pages/CertificatePage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import InstructorMyCourses from './components/Instructor/InstructorMyCourses';
import Enrollments from './components/Instructor/Enrollments';
import CreateCourse from './components/Instructor/CreateCourse';
import Earnings from './components/Instructor/Earnings';
import InstructorScheduleSessionPage from './pages/InstructorScheduleSessionPage';
import InstructorNotifications from './components/Instructor/InstructorNotifications';
import MyReviews from './components/Instructor/MyReviews';
import InstructorGamificationDashboard from './components/Instructor/InstructorGamificationDashboard';
import InstructorManagement from './components/Admin/InstructorManagement';
import AIChatWidget from './components/AIChatWidget';
import AdminLiveSupport from './components/Admin/AdminLiveSupport';
import CertificateManagementPage from './pages/CertificateManagementPage';
import InstructorLayout from './components/Instructor/InstructorLayout';
import CashoutRequests from './components/Admin/CashoutRequests';
import MyStoreItemsPage from './pages/MyStoreItemsPage';
import JobBoardPage from './pages/JobBoardPage';
import AdminJobBoardPage from './pages/AdminJobBoardPage';
import AdminRoleManagementPage from './pages/AdminRoleManagementPage';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm
            formData={formData}
            setFormData={setFormData}
            error={error}
            setError={setError}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        ) : (
          <RegisterForm />
        )}
      </div>
    </div>
  );
}

// Dashboard Layout Component
function DashboardLayout() {
  const { user } = useAuth();
  const [viewingCourseId, setViewingCourseId] = useState<string | null>(null);
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);

  // Handle course viewing
  const handleViewCourse = (courseId: string) => {
    setViewingCourseId(courseId);
  };

  const handleBackFromCourse = () => {
    setViewingCourseId(null);
  };

  // If viewing a course, show the course viewer
  if (viewingCourseId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CourseViewer />
      </div>
    );
  }

  // If showing certificate preview, show the modal
  if (showCertificatePreview) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 lg:p-8 overflow-auto">
            <CertificatePreview onClose={() => setShowCertificatePreview(false)} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet context={{ onViewCourse: handleViewCourse, setShowCertificatePreview }} />
        </main>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Debug logging
  console.log('ProtectedRoute:', { isAuthenticated, user, isLoading, allowedRoles });
  console.log('user.role:', user?.role);

  if (isLoading) {
    // Show a loading spinner or splash screen
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user?.role || '')) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <Outlet />
      </main>
      </div>
    </div>
  );
}

// 1. Remove 'super_admin' from learner and instructor dashboard allowedRoles
// 2. Ensure only 'admin' and 'super_admin' can access /admin routes
// 3. Redirect super_admin users to /admin/overview after login
// 4. Sidebar logic is already handled in AdminSidebar

// Update the root route to redirect based on user role
function AppContent() {
  // Provide minimal state for LoginForm props
  const [loginFormData, setLoginFormData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const handleToggleForm = () => {};
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          user?.role === 'super_admin' ? <Navigate to="/admin/overview" replace /> :
          user?.role === 'admin' ? <Navigate to="/admin/overview" replace /> :
          user?.role === 'instructor' ? <Navigate to="/instructor/dashboard" replace /> :
          <Navigate to="/dashboard" replace />
        } />
        <Route
          path="/login"
          element={
            <LoginForm
              formData={loginFormData}
              setFormData={setLoginFormData}
              error={loginError}
              setError={setLoginError}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          }
        />
        <Route path="/signup" element={<RegisterForm />} />

        {/* Certificate Verification Route (public) */}
        <Route path="/verification" element={<CertificateVerificationPage />} />

        {/* Reset Password Route */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Certificate Page Route (public, sharable) */}
        <Route path="/certificate/:certificateId" element={<CertificatePage />} />

        {/* Instructor Routes */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute allowedRoles={['instructor']}>
              <InstructorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="courses" element={<InstructorMyCourses />} />
          <Route path="profile" element={<InstructorProfile />} />
          <Route path="enrollments" element={<Enrollments />} />
          <Route path="create-course" element={<CreateCourse />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="notifications" element={<InstructorNotifications />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="reviews" element={<MyReviews />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="schedule-session" element={<InstructorScheduleSessionPage />} />
          <Route path="job-board" element={<JobBoardPage />} />
          <Route path="gamification" element={<InstructorGamificationDashboard />} />
        </Route>
        {/* Public Instructor Profile Route */}
        <Route
          path="/instructor/:instructorId"
          element={<InstructorProfilePage />}
        />

        {/* Learner Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            user?.role === 'super_admin'
              ? <Navigate to="/admin/overview" replace />
              : (
                <ProtectedRoute allowedRoles={['learner', 'instructor']}>
                  <DashboardLayout />
                </ProtectedRoute>
              )
          }
        >
          <Route index element={<LearnerDashboard />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="browse" element={<BrowseCourses />} />
          <Route path="notifications" element={<LearnerNotificationCenter />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="progress" element={<Progress />} />
          <Route path="profile" element={<Profile />} />
          <Route path="calendar" element={<LearnerCalendarPage />} />
          <Route path="gamification" element={<GamificationDashboard />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="job-board" element={<JobBoardPage />} />
          <Route path="/dashboard/my-store-items" element={<MyStoreItemsPage />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="overview" element={<AdminOverview />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="users/:userSlug" element={<AdminUserDetailPage />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="schools" element={<SchoolManagement />} />
          <Route path="progress-tracking" element={<ProgressTracking />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="job-board" element={<AdminJobBoardPage />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="schedule-session" element={<AdminScheduleSessionPage />} />
          <Route path="store" element={<StoreManagement />} />
          <Route path="badges" element={<BadgeManagement />} />
          <Route path="moderation" element={<GamificationModeration />} />
          <Route path="coupons" element={<CouponManagement />} />
          <Route path="ratings" element={<RatingManagement />} />
          <Route path="rating-test" element={<RatingTest />} />
          <Route path="referrals" element={<AdminReferralsPage />} />
          <Route path="cashouts" element={<CashoutRequests />} />
          <Route
            path="instructors"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <InstructorManagement />
              </ProtectedRoute>
            }
          />
          <Route path="live-support" element={<AdminLiveSupport />} />
          <Route path="/admin/certificates" element={<CertificateManagementPage />} />
          <Route
            path="role-management"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminRoleManagementPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Course Viewer Route */}
        <Route path="/course/:courseSlug" element={<CourseViewer />} />

        {/* Gamification Dashboard Route */}
        <Route
          path="/gamification"
          element={
            <ProtectedRoute allowedRoles={['learner', 'instructor', 'super_admin']}>
              <GamificationDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SupabaseConnectionStatus />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AIChatWidget />
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;