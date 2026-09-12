import React, { useState } from 'react';
import {
  Bell,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Building2,
  Calendar,
  Radio,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from './SchoolCrest';
import { triggerHaptic } from '../../utils/haptics';
import { CampusMapModal } from './CampusMapModal';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    notifications,
    acknowledgeNotification,
    setActiveView,
    schoolSettings,
    simulationStatus,
    setSimulationMode,
    demoCoords,
  } = useApp();

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showSimulationDropdown, setShowSimulationDropdown] = useState(false);
  const [showCampusModal, setShowCampusModal] = useState(false);
  const unreadNotifs = notifications.filter((n) => !n.acknowledgedByAdmin);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Dadaya High School Brand with Shield Crest */}
          <div
            onClick={() => setActiveView(currentUser?.role === 'admin' ? 'dashboard' : 'home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <SchoolCrest size="sm" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-gray-900 tracking-tight text-sm sm:text-base uppercase group-hover:text-emerald-900 transition">
                  Dadaya High School
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 tracking-wide uppercase line-clamp-1">
                {currentUser?.role === 'admin' ? 'Admin Portal' : 'Faculty Attendance'}
              </span>
            </div>
          </div>

          {/* Center-Right: User Info Displayed on Desktop */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-50 py-1.5 px-3.5 rounded-2xl border border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {currentUser?.name?.[0]}
              {currentUser?.surname?.[0]}
            </div>
            <div className="text-left text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900">
                  {currentUser?.name} {currentUser?.surname}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                    currentUser?.role === 'admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {currentUser?.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                {currentUser?.subject && (
                  <span className="font-medium text-emerald-800">
                    {currentUser.subject}
                  </span>
                )}
                <span>•</span>
                <span className="font-mono text-gray-500">ID: {currentUser?.employeeId || 'DHS-T001'}</span>
              </div>
            </div>
          </div>

          {/* Right Controls: Notification Bell (Admin), Role Badge, Profile/Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* User role pill on mobile */}
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md lg:hidden ${
                currentUser?.role === 'admin'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {currentUser?.role}
            </span>

            {/* Notification Bell with Badge (For Admin: Real-time Teacher Clocking & Early Alerts) */}
            {currentUser?.role === 'admin' && (
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition"
                  title="Live Clocking & Departure Alerts"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 text-xs">
                    <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-2.5">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          Teacher Alerts
                        </h4>
                        <p className="text-[10px] text-gray-500">Live notices</p>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full font-mono">
                        {unreadNotifs.length} new
                      </span>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        <Bell className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {notifications.slice(0, 8).map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-2.5 rounded-xl border ${
                              notif.acknowledgedByAdmin
                                ? 'bg-slate-50 border-slate-200'
                                : notif.type === 'early_in' || notif.type === 'early_out'
                                ? 'bg-amber-50 border-amber-200'
                                : notif.type === 'late_in'
                                ? 'bg-rose-50 border-rose-200'
                                : 'bg-emerald-50 border-emerald-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-gray-900">
                                {notif.teacherName} {notif.teacherSurname}
                              </span>
                              <span className="text-[9px] text-gray-500 font-mono">{notif.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-700">
                              {notif.reason}
                            </p>
                            {!notif.acknowledgedByAdmin && (
                              <button
                                onClick={() => acknowledgeNotification(notif.id)}
                                className="mt-1.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md hover:bg-emerald-200 transition"
                              >
                                Mark Reviewed
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Campus Geofence Map Quick Access */}
            <button
              type="button"
              id="header-campus-map-btn"
              onClick={() => setShowCampusModal(true)}
              className="py-1 px-2 sm:px-2.5 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Open Google Maps Campus Geofence"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Campus</span> Map
            </button>

            {/* Demo Simulation Selector Pill */}
            <div className="relative">
              <button
                type="button"
                id="header-simulation-toggle"
                onClick={() => setShowSimulationDropdown(!showSimulationDropdown)}
                className={`py-1 px-2 sm:px-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                  simulationStatus === 'in_campus'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                    : simulationStatus === 'off_campus'
                    ? 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
                title="Simulate Geofence (In-Campus vs Off-Campus)"
              >
                <Radio
                  className={`w-3.5 h-3.5 ${
                    simulationStatus === 'in_campus'
                      ? 'text-emerald-600 animate-pulse'
                      : simulationStatus === 'off_campus'
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }`}
                />
                <span className="hidden sm:inline">Demo:</span>
                <span className="font-extrabold uppercase text-[10px]">
                  {simulationStatus === 'in_campus'
                    ? 'On-Campus'
                    : simulationStatus === 'off_campus'
                    ? 'Off-Campus'
                    : 'Real GPS'}
                </span>
              </button>

              {/* Simulation Selector Dropdown */}
              {showSimulationDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-xs space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-gray-900 text-xs">GPS Simulator</span>
                    <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      Dadaya Geofence (100m)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    Simulate your physical location to test in-campus vs off-campus clocking behavior:
                  </p>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSimulationMode('in_campus');
                        triggerHaptic('success');
                        setShowSimulationDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        simulationStatus === 'in_campus'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">In-Campus (At Dadaya)</div>
                          <div className="text-[10px] text-slate-500 font-mono">0m • Within 100m fence</div>
                        </div>
                      </div>
                      {simulationStatus === 'in_campus' && (
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                          Active
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSimulationMode('off_campus');
                        triggerHaptic('medium');
                        setShowSimulationDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        simulationStatus === 'off_campus'
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">Off-Campus (Zvishavane Town)</div>
                          <div className="text-[10px] text-slate-500 font-mono">~8.5km away • Locked</div>
                        </div>
                      </div>
                      {simulationStatus === 'off_campus' && (
                        <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded font-bold">
                          Active
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSimulationMode('real_gps');
                        triggerHaptic('light');
                        setShowSimulationDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        simulationStatus === 'real_gps'
                          ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">Live Device GPS</div>
                          <div className="text-[10px] text-slate-500">Real phone/browser GPS</div>
                        </div>
                      </div>
                      {simulationStatus === 'real_gps' && (
                        <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                          Active
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Icon */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Google Maps Campus Geofence Modal */}
      <CampusMapModal
        isOpen={showCampusModal}
        onClose={() => setShowCampusModal(false)}
        schoolSettings={schoolSettings}
        userCoords={
          simulationStatus !== 'real_gps'
            ? {
                latitude: demoCoords.latitude,
                longitude: demoCoords.longitude,
              }
            : null
        }
        isSimulated={simulationStatus !== 'real_gps'}
      />
    </header>
  );
};
