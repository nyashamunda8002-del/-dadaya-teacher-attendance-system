import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from './components/auth/SplashScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { AndroidInstallBanner } from './components/common/AndroidInstallBanner';
import { TeacherAiAssistant } from './components/common/TeacherAiAssistant';
import { OfflineQueueBar } from './components/common/OfflineQueueBar';
import { triggerHaptic } from './utils/haptics';

// Teacher Views
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TeacherHistory } from './components/teacher/TeacherHistory';
import { TeacherAttendance } from './components/teacher/TeacherAttendance';
import { TeacherLeave } from './components/teacher/TeacherLeave';
import { TeacherReports } from './components/teacher/TeacherReports';
import { TeacherProfile } from './components/teacher/TeacherProfile';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminTeachers } from './components/admin/AdminTeachers';
import { AdminAttendanceReport } from './components/admin/AdminAttendanceReport';
import { AdminLeaveManagement } from './components/admin/AdminLeaveManagement';
import { AdminReportsMenu } from './components/admin/AdminReportsMenu';
import { AdminSettings } from './components/admin/AdminSettings';

const MainAppContent: React.FC = () => {
  const { currentUser, isLoading, activeView, setActiveView } = useApp();

  // Android Back Button listener: Navigates to home screen instead of closing app
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (currentUser) {
        const homeView = currentUser.role === 'teacher' ? 'home' : 'dashboard';
        if (activeView !== homeView) {
          triggerHaptic('light');
          setActiveView(homeView);
        }
      }
    };

    window.history.pushState({ view: activeView }, '');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeView, currentUser, setActiveView]);

  // 1. Splash Screen during initial boot & auto-login check
  if (isLoading) {
    return <SplashScreen role={currentUser?.role} />;
  }

  // 2. Unauthenticated -> Auth Screen (Sign up / Login)
  if (!currentUser) {
    return (
      <>
        <AndroidInstallBanner />
        <AuthScreen />
      </>
    );
  }

  // Render view router based on user role and activeView
  const renderActiveView = () => {
    if (currentUser.role === 'teacher') {
      switch (activeView) {
        case 'home':
          return <TeacherDashboard />;
        case 'history':
          return <TeacherHistory />;
        case 'attendance':
          return <TeacherAttendance />;
        case 'leave':
          return <TeacherLeave />;
        case 'reports':
          return <TeacherReports />;
        case 'profile':
          return <TeacherProfile />;
        default:
          return <TeacherDashboard />;
      }
    } else {
      // Admin views
      switch (activeView) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'teachers':
          return <AdminTeachers />;
        case 'attendance-report':
          return <AdminAttendanceReport />;
        case 'admin-leave':
          return <AdminLeaveManagement />;
        case 'admin-reports':
          return <AdminReportsMenu />;
        case 'settings':
          return <AdminSettings />;
        default:
          return <AdminDashboard />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-emerald-200">
      <AndroidInstallBanner />
      <Header />
      <Navigation />

      {/* Main Content Area - Optimized for mobile touch & desktop readability */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 py-4 sm:px-6 sm:py-6 pb-24 md:pb-12">
        <OfflineQueueBar />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView + '-' + currentUser.role}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating AI Navigation Assistant for Teachers & Staff */}
      <TeacherAiAssistant />

      {/* Global Desktop Footer */}
      <footer className="hidden md:block bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="font-medium text-slate-600">
            © {new Date().getFullYear()} Dadaya High School Attendance Management System
          </p>
          <p className="text-xs text-slate-500">
            Created by <span className="font-bold text-emerald-800">Nyasha Munda</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
