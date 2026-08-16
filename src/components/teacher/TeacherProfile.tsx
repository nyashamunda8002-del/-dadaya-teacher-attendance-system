import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User as UserIcon,
  BookOpen,
  Mail,
  Lock,
  Bell,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Phone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from '../common/SchoolCrest';

export const TeacherProfile: React.FC = () => {
  const { currentUser, updateUserProfile, logout, schoolSettings } = useApp();

  const [activeModal, setActiveModal] = useState<'edit' | 'password' | 'notifications' | 'about' | null>(null);

  // Edit form state
  const [name, setName] = useState(currentUser?.name || '');
  const [surname, setSurname] = useState(currentUser?.surname || '');
  const [subject, setSubject] = useState(currentUser?.subject || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Password form state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim(),
      surname: surname.trim(),
      subject: subject.trim(),
      phone: phone.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveModal(null);
    }, 1200);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 4) {
      setPassError('New password must be at least 4 characters');
      return;
    }
    updateUserProfile({
      password: newPass,
    });
    setPassSuccess(true);
    setTimeout(() => {
      setPassSuccess(false);
      setActiveModal(null);
      setCurrentPass('');
      setNewPass('');
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Profile Card matching Wireframe screen #8 */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center flex flex-col items-center">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-800 border-4 border-emerald-100 flex items-center justify-center text-white text-3xl font-extrabold shadow-md mb-3">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>
              {currentUser?.name?.[0]}
              {currentUser?.surname?.[0]}
            </span>
          )}
        </div>

        {/* Dynamic Teacher Name from Sign-in */}
        <h2 className="text-xl font-extrabold text-gray-900">
          {currentUser?.name} {currentUser?.surname}
        </h2>
        <span className="mt-1 px-3.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
          Teacher • {currentUser?.subject || 'Faculty'}
        </span>

        {/* Quick Credentials Info Display */}
        <div className="mt-5 grid grid-cols-2 gap-3 w-full max-w-md text-left text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Email Address</span>
            <span className="font-semibold text-gray-800 truncate block">{currentUser?.email}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Employee ID</span>
            <span className="font-mono font-bold text-emerald-800">{currentUser?.employeeId || 'DHS-T001'}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">School</span>
            <span className="font-semibold text-gray-800 truncate block">{schoolSettings.schoolName}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Department</span>
            <span className="font-semibold text-gray-800 truncate block">{currentUser?.department || 'Academics'}</span>
          </div>
        </div>
      </div>

      {/* Profile Actions List matching Wireframe */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-xs divide-y divide-gray-100">
        {/* Edit Profile */}
        <button
          onClick={() => {
            setName(currentUser?.name || '');
            setSurname(currentUser?.surname || '');
            setSubject(currentUser?.subject || '');
            setPhone(currentUser?.phone || '');
            setActiveModal('edit');
          }}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 rounded-2xl transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Edit Profile</h4>
              <p className="text-xs text-gray-500">Update your name, subject, or contact info</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Change Password */}
        <button
          onClick={() => setActiveModal('password')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 rounded-2xl transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Change Password</h4>
              <p className="text-xs text-gray-500">Manage your account security credentials</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Notification Settings */}
        <button
          onClick={() => setActiveModal('notifications')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 rounded-2xl transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Notification Settings</h4>
              <p className="text-xs text-gray-500">Clock in alerts and admin notification triggers</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Help & Support */}
        <div className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 rounded-2xl transition">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Help & Support</h4>
              <p className="text-xs text-gray-500">Contact school administrative office or IT support</p>
            </div>
          </div>
          <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg">
            support@dadayahigh.ac.zw
          </span>
        </div>

        {/* About App */}
        <button
          onClick={() => setActiveModal('about')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 rounded-2xl transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">About App</h4>
              <p className="text-xs text-gray-500">Dadaya High School Attendance System v2.4 (Commercial Edition)</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Logout */}
        <button
          id="teacher-logout-btn"
          onClick={logout}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50 rounded-2xl transition group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:bg-rose-100">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-700">Logout</h4>
              <p className="text-xs text-rose-500">Sign out of this device and return to sign-in page</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-400" />
        </button>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {activeModal === 'edit' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-base">Edit Profile Information</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {savedSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Surname</label>
                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Contact Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="+263 77 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
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
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {activeModal === 'password' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-base">Change Password</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {passSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Password changed successfully!</span>
                </div>
              )}

              {passError && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-800 text-xs rounded-xl">
                  {passError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
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
                    className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* About App Modal */}
      <AnimatePresence>
        {activeModal === 'about' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-6 text-center"
            >
              <SchoolCrest size="md" className="mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 text-lg uppercase tracking-wide">
                Dadaya High School
              </h3>
              <p className="text-xs text-emerald-700 font-semibold uppercase tracking-widest mb-4">
                Staff Attendance Management System
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl text-xs text-gray-600 text-left space-y-2 border border-slate-100">
                <p><strong>System:</strong> Dadaya High School Staff Attendance Portal</p>
                <p><strong>Developer / Author:</strong> <span className="font-bold text-emerald-800">Nyasha Munda</span></p>
                <p><strong>Institution:</strong> Dadaya High School, Shabani (Zvishavane), Zimbabwe</p>
                <p><strong>Capabilities:</strong> Real-time GPS verification, Cloud SQL synchronization, Early departure admin alerts, and automated attendance reporting.</p>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="mt-5 w-full py-2.5 bg-emerald-700 text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
