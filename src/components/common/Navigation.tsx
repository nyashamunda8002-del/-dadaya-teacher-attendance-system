import React from 'react';
import {
  Home,
  Clock,
  CalendarCheck,
  FileText,
  User as UserIcon,
  Users,
  BarChart3,
  Sliders,
  CalendarDays,
  CheckSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

export const Navigation: React.FC = () => {
  const { currentUser, activeView, setActiveView, leaveRequests } = useApp();

  const isTeacher = currentUser?.role === 'teacher';

  const pendingLeaveCount = isTeacher
    ? leaveRequests.filter((l) => l.userId === currentUser?.id && l.status === 'pending').length
    : leaveRequests.filter((l) => l.status === 'pending').length;

  const teacherTabs = [
    { id: 'home', label: 'Clock In', icon: Home },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'leave', label: 'Leave', icon: CalendarDays, badge: pendingLeaveCount },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const adminTabs = [
    { id: 'dashboard', label: 'Overview', icon: Home },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'attendance-report', label: 'Attendance', icon: BarChart3 },
    { id: 'admin-leave', label: 'Leave', icon: CheckSquare, badge: pendingLeaveCount },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  const currentTabs = isTeacher ? teacherTabs : adminTabs;

  return (
    <>
      {/* Desktop Top Sub-Nav Bar */}
      <nav className="bg-slate-50 border-b border-slate-200 hidden md:block">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-1.5 py-2">
            {currentTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveView(tab.id);
                  }}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${
                    isActive
                      ? isTeacher
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-blue-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isActive
                          ? 'bg-white text-emerald-800'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden shadow-lg pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around h-15 px-1">
          {currentTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveView(tab.id);
                }}
                className={`relative flex-1 flex flex-col items-center justify-center h-full py-1 transition-all select-none active:scale-95 ${
                  isActive
                    ? isTeacher
                      ? 'text-emerald-800 font-bold'
                      : 'text-blue-800 font-bold'
                    : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={`p-1 rounded-xl transition ${
                      isActive
                        ? isTeacher
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                        : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-0.5 -right-1 min-w-4 h-4 px-1 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
