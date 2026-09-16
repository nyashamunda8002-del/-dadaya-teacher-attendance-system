import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  School,
  Users,
  Building,
  Clock,
  Database,
  UserCog,
  ChevronRight,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LogOut,
  X,
  Flame,
  CloudCheck,
  Radio,
  Volume2,
  VolumeX,
  Play,
  CalendarDays,
  Sparkles,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  ShieldCheck,
  Calendar,
  Bell,
  Smartphone,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundEffects } from '../../utils/soundEffects';
import {
  sendPhoneNotification,
  requestPhoneNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
} from '../../utils/phoneNotifications';

export const AdminSettings: React.FC = () => {
  const {
    schoolSettings,
    updateSchoolSettings,
    resetAllData,
    logout,
    setActiveView,
    users,
    attendanceRecords,
    isFirebaseLinked,
    leaveRequests,
    exportCompleteBackup,
    exportAttendanceCSV,
    restoreBackupData,
  } = useApp();

  const [activeModal, setActiveModal] = useState<'school' | 'rules' | 'backup' | 'confirmReset' | 'termDates' | 'notifications' | null>(null);
  const [backupRestoreStatus, setBackupRestoreStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sound & notification settings
  const [soundEnabled, setSoundEnabled] = useState(schoolSettings.soundEffectsEnabled ?? true);
  const [phoneNotifsEnabled, setPhoneNotifsEnabled] = useState(schoolSettings.phoneNotificationsEnabled ?? true);
  const [notificationPerm, setNotificationPerm] = useState<string>(getNotificationPermission());
  const [testNotifSent, setTestNotifSent] = useState(false);

  // School info form
  const [schoolName, setSchoolName] = useState(schoolSettings.schoolName);
  const [academicYear, setAcademicYear] = useState(schoolSettings.academicYear);
  const [allowedRadius, setAllowedRadius] = useState(schoolSettings.allowedRadiusMeters);
  const [latitude, setLatitude] = useState(schoolSettings.schoolLatitude);
  const [longitude, setLongitude] = useState(schoolSettings.schoolLongitude);
  const [lockMessage, setLockMessage] = useState(
    schoolSettings.lockMessage ||
      'Attendance clocking is locked: You are outside Dadaya High School campus. You must be physically within the 100m school boundary to clock in or clock out.'
  );

  // Term dates form
  const [currentTerm, setCurrentTerm] = useState(schoolSettings.currentTerm || 'Term 1');
  const [termStartDate, setTermStartDate] = useState(schoolSettings.termStartDate || '2026-01-13');
  const [termEndDate, setTermEndDate] = useState(schoolSettings.termEndDate || '2026-04-10');
  const [termNotes, setTermNotes] = useState(schoolSettings.termNotes || 'First Term 2026 - Academic & Co-curricular sessions');

  React.useEffect(() => {
    setSchoolName(schoolSettings.schoolName);
    setAcademicYear(schoolSettings.academicYear);
    setAllowedRadius(schoolSettings.allowedRadiusMeters);
    setLatitude(schoolSettings.schoolLatitude);
    setLongitude(schoolSettings.schoolLongitude);
    setLockMessage(
      schoolSettings.lockMessage ||
        'Attendance clocking is locked: You are outside Dadaya High School campus. You must be physically within the 100m school boundary to clock in or clock out.'
    );
    setSoundEnabled(schoolSettings.soundEffectsEnabled ?? true);
    setPhoneNotifsEnabled(schoolSettings.phoneNotificationsEnabled ?? true);
    setCurrentTerm(schoolSettings.currentTerm || 'Term 1');
    setTermStartDate(schoolSettings.termStartDate || '2026-01-13');
    setTermEndDate(schoolSettings.termEndDate || '2026-04-10');
    setTermNotes(schoolSettings.termNotes || 'First Term 2026 - Academic & Co-curricular sessions');
    setNotificationPerm(getNotificationPermission());
    setAllowWeekend(schoolSettings.allowWeekendClocking ?? true);
    setAutoClockIn(schoolSettings.autoClockInGeofence ?? true);
  }, [schoolSettings]);

  // Attendance rules form
  const [clockInTime, setClockInTime] = useState(schoolSettings.standardClockInTime);
  const [clockOutTime, setClockOutTime] = useState(schoolSettings.standardClockOutTime);
  const [lateGrace, setLateGrace] = useState(schoolSettings.lateGracePeriodMinutes);
  const [earlyInThreshold, setEarlyInThreshold] = useState(schoolSettings.earlyClockInThreshold);
  const [earlyOutThreshold, setEarlyOutThreshold] = useState(schoolSettings.earlyClockOutThreshold);
  const [allowWeekend, setAllowWeekend] = useState(schoolSettings.allowWeekendClocking ?? true);
  const [autoClockIn, setAutoClockIn] = useState(schoolSettings.autoClockInGeofence ?? true);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSchoolInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolSettings({
      schoolName: schoolName.trim(),
      academicYear: academicYear.trim(),
      allowedRadiusMeters: Number(allowedRadius),
      schoolLatitude: Number(latitude),
      schoolLongitude: Number(longitude),
      lockMessage: lockMessage.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveModal(null);
    }, 1500);
  };

  const handleSaveTermDates = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolSettings({
      currentTerm: currentTerm.trim(),
      termStartDate,
      termEndDate,
      termNotes: termNotes.trim(),
      academicYear: academicYear.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveModal(null);
    }, 1200);
  };

  const handleRequestPhonePermission = async () => {
    const res = await requestPhoneNotificationPermission();
    setNotificationPerm(res.permission);
  };

  const handleSendTestNotification = async () => {
    const success = await sendPhoneNotification({
      title: 'Dadaya High School Attendance',
      body: `Test phone notification alert dispatched successfully at ${new Date().toLocaleTimeString()}!`,
      tag: 'test-notification',
    });
    if (success) {
      setTestNotifSent(true);
      setTimeout(() => setTestNotifSent(false), 3000);
    }
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolSettings({
      standardClockInTime: clockInTime,
      standardClockOutTime: clockOutTime,
      lateGracePeriodMinutes: Number(lateGrace),
      earlyClockInThreshold: earlyInThreshold,
      earlyClockOutThreshold: earlyOutThreshold,
      allowWeekendClocking: allowWeekend,
      autoClockInGeofence: autoClockIn,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveModal(null);
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setBackupRestoreStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const result = await restoreBackupData(parsed);
        if (result.success) {
          setBackupRestoreStatus({ type: 'success', message: result.message });
        } else {
          setBackupRestoreStatus({ type: 'error', message: result.message });
        }
      } catch (err: any) {
        setBackupRestoreStatus({
          type: 'error',
          message: 'Failed to read JSON backup file. Please ensure it is a valid backup.',
        });
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setIsRestoring(false);
      setBackupRestoreStatus({ type: 'error', message: 'File reading encountered an unexpected error.' });
    };
    reader.readAsText(file);
  };

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending').length;

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    updateSchoolSettings({ soundEffectsEnabled: enabled });
    if (enabled) {
      soundEffects.playClockInSuccess();
    }
  };

  const handleTogglePhoneNotifs = (enabled: boolean) => {
    setPhoneNotifsEnabled(enabled);
    updateSchoolSettings({ phoneNotificationsEnabled: enabled });
    if (enabled && notificationPerm !== 'granted') {
      handleRequestPhonePermission();
    }
  };

  // Calculate term progress
  const startTs = new Date(schoolSettings.termStartDate || '2026-01-13').getTime();
  const endTs = new Date(schoolSettings.termEndDate || '2026-04-10').getTime();
  const nowTs = Date.now();
  const totalTermDays = Math.max(1, Math.round((endTs - startTs) / (1000 * 60 * 60 * 24)));
  const elapsedTermDays = Math.max(0, Math.min(totalTermDays, Math.round((nowTs - startTs) / (1000 * 60 * 60 * 24))));
  const remainingTermDays = Math.max(0, Math.round((endTs - nowTs) / (1000 * 60 * 60 * 24)));
  const termPercent = Math.min(100, Math.max(0, Math.round((elapsedTermDays / totalTermDays) * 100)));

  const menuItems = [
    {
      id: 'termDates',
      title: 'Academic Term & Calendar',
      desc: `Configure ${schoolSettings.currentTerm || 'Term 1'} start (${schoolSettings.termStartDate || '13 Jan'}) & closing dates (${schoolSettings.termEndDate || '10 Apr'})`,
      icon: Calendar,
      badge: `${remainingTermDays} Days Left`,
      action: () => setActiveModal('termDates'),
    },
    {
      id: 'notifications',
      title: 'Phone Push Notifications',
      desc: 'Instant device lockscreen & banner alerts for clock-ins, clock-outs and leaves',
      icon: Smartphone,
      badge: notificationPerm === 'granted' ? 'Active' : 'Setup Required',
      action: () => setActiveModal('notifications'),
    },
    {
      id: 'school',
      title: 'School Information & Campus GPS',
      desc: 'View and update institution name, GPS coordinates and academic year',
      icon: School,
      action: () => setActiveModal('school'),
    },
    {
      id: 'teachers',
      title: 'Manage Teachers',
      desc: 'Add, edit or remove teaching faculty members & EC numbers',
      icon: Users,
      action: () => setActiveView('teachers'),
    },
    {
      id: 'leaves',
      title: 'Faculty Leave & Absence',
      desc: pendingLeaves > 0 ? `${pendingLeaves} pending leave requests waiting for review` : 'Review, approve and manage staff absence applications',
      icon: CalendarDays,
      badge: pendingLeaves > 0 ? `${pendingLeaves} Pending` : undefined,
      action: () => setActiveView('admin-leave'),
    },
    {
      id: 'rules',
      title: 'Attendance Rules & Timetable',
      desc: 'Configure standard hours, late threshold (07:45) & early notices',
      icon: Clock,
      action: () => setActiveModal('rules'),
    },
    {
      id: 'backup',
      title: 'Backup & Restore Database',
      desc: 'Export complete database logs and configurations',
      icon: Database,
      action: () => setActiveModal('backup'),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header matching wireframe screen #8 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900">Admin Settings</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          System policies, academic calendar terms, notifications and institutional preferences for {schoolSettings.schoolName}
        </p>
      </div>

      {/* Academic Term Progress Banner Card */}
      <div className="bg-linear-to-br from-blue-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-400 border border-white/10 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base">
                  {schoolSettings.currentTerm || 'Term 1'} • {schoolSettings.academicYear || '2026 Academic Year'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Official Term Period
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Beginning: <strong className="text-white font-mono">{schoolSettings.termStartDate || '2026-01-13'}</strong> • Closing/Ending: <strong className="text-white font-mono">{schoolSettings.termEndDate || '2026-04-10'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal('termDates')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center"
          >
            <Calendar className="w-3.5 h-3.5" /> Edit Term Dates
          </button>
        </div>

        {/* Term Completion Progress Bar */}
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Term Progress ({elapsedTermDays} of {totalTermDays} calendar days)</span>
            <span className="font-bold text-emerald-400">{termPercent}% Elapsed • {remainingTermDays} Days Remaining</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${termPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Phone Push Notifications Management Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notificationPerm === 'granted' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm">Direct Phone Push Notifications</h3>
                {notificationPerm === 'granted' ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-flex items-center gap-1">
                    <Check className="w-3 h-3" /> Enabled on Device
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                    Permission Needed
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Delivers instant phone drawer alerts for teacher clock-ins, late arrivals, departures, and leave applications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notificationPerm !== 'granted' && (
              <button
                onClick={handleRequestPhonePermission}
                className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Allow Phone Alerts
              </button>
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={phoneNotifsEnabled}
                onChange={(e) => handleTogglePhoneNotifs(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-700"></div>
            </label>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-gray-500 text-[11px]">
            Test your phone notification tray integration:
          </span>
          <button
            onClick={handleSendTestNotification}
            className={`px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
              testNotifSent
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {testNotifSent ? 'Notification Sent to Phone!' : 'Send Test Phone Alert'}
          </button>
        </div>
      </div>

      {/* Firebase Cloud Sync Status Card */}
      <div className="bg-linear-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-200/60 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Firebase Cloud Firestore Linked</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Real-Time Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Project: <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">distributed-rig-z9v0l</code> • Live bi-directional replication with security rules
            </p>
          </div>
        </div>
      </div>

      {/* Audio Feedback & Sound Effects Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Auditory Feedback & Chimes</h3>
              <p className="text-xs text-gray-500">Play pleasant audio tones on Clock-In, Clock-Out, and NFC Badge scan</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => handleToggleSound(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {soundEnabled && (
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-gray-400 text-[11px] font-semibold mr-1">Preview Audio:</span>
            <button
              onClick={() => soundEffects.playClockInSuccess()}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg hover:bg-emerald-100 font-semibold inline-flex items-center gap-1 text-[11px]"
            >
              <Play className="w-3 h-3" /> Clock In Chime
            </button>
            <button
              onClick={() => soundEffects.playClockOutSuccess()}
              className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 font-semibold inline-flex items-center gap-1 text-[11px]"
            >
              <Play className="w-3 h-3" /> Clock Out Chime
            </button>
            <button
              onClick={() => soundEffects.playBadgeScanSuccess()}
              className="px-2.5 py-1 bg-purple-50 text-purple-800 rounded-lg hover:bg-purple-100 font-semibold inline-flex items-center gap-1 text-[11px]"
            >
              <Play className="w-3 h-3" /> NFC Badge Chime
            </button>
          </div>
        )}
      </div>

      {/* Settings Menu List matching Wireframe */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-xs divide-y divide-gray-100">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 rounded-2xl transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          );
        })}

        {/* Clear / Reset App Data (User Requirement to remove all old fake data cleanly) */}
        <button
          onClick={() => setActiveModal('confirmReset')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-amber-50 rounded-2xl transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Reset / Clear All System Data</h4>
              <p className="text-xs text-amber-700">Wipe all cached records and start with a clean slate</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400" />
        </button>

        {/* Logout */}
        <button
          id="admin-logout-btn"
          onClick={logout}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50 rounded-2xl transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-700">Sign Out Administrator</h4>
              <p className="text-xs text-rose-500">Sign out and return to portal login screen</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-400" />
        </button>

        {/* System Authorship & Attribution Card */}
        <div className="pt-4 border-t border-slate-100 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-slate-500">
          <span>Dadaya High School Attendance Portal</span>
          <span>Programmed by <strong className="text-slate-800 font-bold">Gunda Technologies</strong> • Chief Technology Officer <strong className="text-emerald-800 font-bold">Nyasha Munda</strong></span>
        </div>
      </div>

      {/* Academic Term Dates Modal */}
      <AnimatePresence>
        {activeModal === 'termDates' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Academic Term Dates</h3>
                    <p className="text-[11px] text-gray-500">Configure official term start and closing dates</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {saveSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Academic term dates successfully updated and saved!</span>
                </div>
              )}

              <form onSubmit={handleSaveTermDates} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Active Term Selection</label>
                  <select
                    value={currentTerm}
                    onChange={(e) => setCurrentTerm(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-semibold text-slate-800"
                  >
                    <option value="Term 1">Term 1 (First Term)</option>
                    <option value="Term 2">Term 2 (Second Term)</option>
                    <option value="Term 3">Term 3 (Third Term)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Term Beginning Date <span className="text-emerald-700 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      value={termStartDate}
                      onChange={(e) => setTermStartDate(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">School reopens / starts</p>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Term Ending Date <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      value={termEndDate}
                      onChange={(e) => setTermEndDate(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">School closes / vacation</p>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. 2026 Academic Year"
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Term Description & Remarks</label>
                  <textarea
                    rows={2}
                    value={termNotes}
                    onChange={(e) => setTermNotes(e.target.value)}
                    placeholder="e.g. First Term 2026 - Academic lectures, sports & examinations"
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                {/* Calculation summary */}
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold block">Calendar Duration</span>
                    <span className="text-[11px] text-emerald-700">{termStartDate} to {termEndDate}</span>
                  </div>
                  <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2 py-1 rounded-lg">
                    {Math.max(1, Math.round((new Date(termEndDate).getTime() - new Date(termStartDate).getTime()) / (1000 * 60 * 60 * 24)))} Days
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-gray-600 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Term Dates
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Phone Notifications Setup Modal */}
      <AnimatePresence>
        {activeModal === 'notifications' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Phone Push Notifications</h3>
                    <p className="text-[11px] text-gray-500">Android device and browser notification alerts</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950">Permission Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      notificationPerm === 'granted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : notificationPerm === 'denied'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {notificationPerm.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800">
                    When active, your phone vibrates and shows immediate notifications on your lock screen and notification shade when attendance actions take place.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <h4 className="font-bold text-slate-900 text-xs">Supported Alert Events:</h4>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span><strong>Teacher Clock-In:</strong> Instant notification when faculty check in on campus</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span><strong>Late Arrivals & Early Notices:</strong> Alerts for after 07:45 or early departure requests</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span><strong>Teacher Clock-Out:</strong> Shift completion and duty hours summary</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span><strong>Leave Applications:</strong> Submissions and review approval status</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  {notificationPerm !== 'granted' ? (
                    <button
                      onClick={handleRequestPhonePermission}
                      className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs transition text-center"
                    >
                      Enable Phone Notifications Now
                    </button>
                  ) : (
                    <button
                      onClick={handleSendTestNotification}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition text-center inline-flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-4 h-4" />
                      {testNotifSent ? 'Test Notification Sent to Phone!' : 'Send Test Notification'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="w-full py-2 text-gray-500 hover:text-gray-700 font-semibold rounded-xl text-center"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* School Info Modal */}
      <AnimatePresence>
        {activeModal === 'school' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">School & Geofence Configuration</h3>
                  <p className="text-[11px] text-gray-500">Google Maps boundary and GPS coordinate setup</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {saveSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>School details and geofence coordinates saved successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveSchoolInfo} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">School Name</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Latitude (°S negative)</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      required
                      placeholder="-20.334288"
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">-20.334288° S</p>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Longitude (°E positive)</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      required
                      placeholder="29.896082"
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">29.896082° E</p>
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Geofence Allowed Radius (Meters)</label>
                  <input
                    type="number"
                    value={allowedRadius}
                    onChange={(e) => setAllowedRadius(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Lock Message (Shown to Teachers when Off-Campus)</label>
                  <textarea
                    rows={2}
                    value={lockMessage}
                    onChange={(e) => setLockMessage(e.target.value)}
                    placeholder="Attendance clocking is locked: You are outside Dadaya High School campus..."
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Displayed automatically when teachers try to clock in/out outside the 100m geofence.</p>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-gray-600 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-xl shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attendance Rules Modal */}
      <AnimatePresence>
        {activeModal === 'rules' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-base">Attendance Rules & Thresholds</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {saveSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Attendance rules updated!</span>
                </div>
              )}

              <form onSubmit={handleSaveRules} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Standard Clock In</label>
                    <input
                      type="time"
                      value={clockInTime}
                      onChange={(e) => setClockInTime(e.target.value)}
                      required
                      className="w-full p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Standard Clock Out</label>
                    <input
                      type="time"
                      value={clockOutTime}
                      onChange={(e) => setClockOutTime(e.target.value)}
                      required
                      className="w-full p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Early In Trigger (Before)</label>
                    <input
                      type="time"
                      value={earlyInThreshold}
                      onChange={(e) => setEarlyInThreshold(e.target.value)}
                      required
                      className="w-full p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Early Out Trigger (Before)</label>
                    <input
                      type="time"
                      value={earlyOutThreshold}
                      onChange={(e) => setEarlyOutThreshold(e.target.value)}
                      required
                      className="w-full p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Late Grace Period (Minutes)</label>
                  <input
                    type="number"
                    value={lateGrace}
                    onChange={(e) => setLateGrace(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-slate-50 border border-gray-200 rounded-xl"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Arrivals past {clockInTime} + {lateGrace}m are marked Late.</p>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <span className="font-semibold text-gray-800 block text-xs">Allow Weekend Clocking</span>
                      <span className="text-[11px] text-gray-500 block">Permit teachers to record attendance on Saturdays and Sundays</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-3">
                      <input
                        type="checkbox"
                        checked={allowWeekend}
                        onChange={(e) => setAllowWeekend(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-emerald-950 block text-xs">Automatic Geofence Clock-In</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-200 text-emerald-900 uppercase">
                          Clock-In Only
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-800 block mt-0.5">Automatically clocks in teachers the instant they enter Dadaya High School campus (Clock-out remains manual for security)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-3">
                      <input
                        type="checkbox"
                        checked={autoClockIn}
                        onChange={(e) => setAutoClockIn(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-gray-600 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-xl shadow-xs"
                  >
                    Save Rules
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Backup Modal */}
      <AnimatePresence>
        {activeModal === 'backup' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Backup & Record Preservation</h3>
                    <p className="text-[11px] text-gray-500">Secure export, CSV reporting, and cloud synchronization</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setBackupRestoreStatus(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Data Persistence Guarantee Banner */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl mb-4 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <p className="font-bold">Permanent Attendance Protection</p>
                  <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                    Attendance records of logged out teachers are permanently retained. Logging out never deletes history, and all logs are backed up to Cloud Firestore.
                  </p>
                </div>
              </div>

              {/* Current Database Statistics */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-600">Total Records</p>
                  <p className="text-base font-extrabold text-slate-900">{attendanceRecords.length}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-600">Faculty Staff</p>
                  <p className="text-base font-extrabold text-slate-900">{users.length}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-600">Leave Logs</p>
                  <p className="text-base font-extrabold text-slate-900">{leaveRequests.length}</p>
                </div>
              </div>

              {/* Status Message */}
              {backupRestoreStatus && (
                <div
                  className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                    backupRestoreStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {backupRestoreStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{backupRestoreStatus.message}</span>
                </div>
              )}

              {/* Export Section */}
              <div className="space-y-2 mb-5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Export Options</label>
                
                <button
                  onClick={exportCompleteBackup}
                  className="w-full p-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-emerald-200" />
                    <span>Download Full System Snapshot (JSON)</span>
                  </div>
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={exportAttendanceCSV}
                  className="w-full p-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-slate-300" />
                    <span>Export Attendance Ledger (Excel / CSV)</span>
                  </div>
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* Import / Restore Section */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                  Restore / Import Backup
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,application/json"
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRestoring}
                  className="w-full p-3 border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{isRestoring ? 'Restoring records...' : 'Select JSON Backup File to Restore'}</span>
                </button>
                <p className="text-[10px] text-gray-400 text-center">
                  Restoring will merge records and synchronize with Cloud Firestore.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Reset Modal */}
      <AnimatePresence>
        {activeModal === 'confirmReset' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Reset All System Data?</h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                This will wipe all existing cached data and let you create fresh clean accounts with no old records.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetAllData();
                    setActiveModal(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Confirm Wipe
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
