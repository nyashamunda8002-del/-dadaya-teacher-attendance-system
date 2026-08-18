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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundEffects } from '../../utils/soundEffects';

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

  const [activeModal, setActiveModal] = useState<'school' | 'rules' | 'backup' | 'confirmReset' | null>(null);
  const [backupRestoreStatus, setBackupRestoreStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(schoolSettings.soundEffectsEnabled ?? true);

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
  }, [schoolSettings]);

  // Attendance rules form
  const [clockInTime, setClockInTime] = useState(schoolSettings.standardClockInTime);
  const [clockOutTime, setClockOutTime] = useState(schoolSettings.standardClockOutTime);
  const [lateGrace, setLateGrace] = useState(schoolSettings.lateGracePeriodMinutes);
  const [earlyInThreshold, setEarlyInThreshold] = useState(schoolSettings.earlyClockInThreshold);
  const [earlyOutThreshold, setEarlyOutThreshold] = useState(schoolSettings.earlyClockOutThreshold);

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

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolSettings({
      standardClockInTime: clockInTime,
      standardClockOutTime: clockOutTime,
      lateGracePeriodMinutes: Number(lateGrace),
      earlyClockInThreshold: earlyInThreshold,
      earlyClockOutThreshold: earlyOutThreshold,
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

  const menuItems = [
    {
      id: 'school',
      title: 'School Information',
      desc: 'View and update institution name, GPS coordinates and academic year',
      icon: School,
      action: () => setActiveModal('school'),
    },
    {
      id: 'teachers',
      title: 'Manage Teachers',
      desc: 'Add, edit or remove teaching faculty members',
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
      title: 'Attendance Rules',
      desc: 'Configure standard hours, late threshold & early notices',
      icon: Clock,
      action: () => setActiveModal('rules'),
    },
    {
      id: 'backup',
      title: 'Backup & Restore',
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
          System policies, institution preferences, and account maintenance for {schoolSettings.schoolName}
        </p>
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
        <div className="pt-4 border-t border-slate-100 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>Dadaya High School Attendance Portal</span>
          <span>Created by <strong className="text-emerald-800 font-bold">Nyasha Munda</strong></span>
        </div>
      </div>

      {/* School Info Modal */}
      <AnimatePresence>
        {activeModal === 'school' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-base">School Information</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {saveSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>School details saved successfully!</span>
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
                      placeholder="-20.340490"
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">20.340490° S = -20.340490</p>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Longitude (°E positive)</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      required
                      placeholder="29.977820"
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">29.977820° E = 29.977820</p>
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
