import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  User as UserIcon,
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Sparkles,
  KeyRound,
  Shield,
  HelpCircle,
  RotateCcw,
  Check,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from '../common/SchoolCrest';
import { triggerHaptic } from '../../utils/haptics';

export const AuthScreen: React.FC = () => {
  const { registerTeacher, loginUser, findTeacherByEcNumber, resetTeacherPasswordWithEcNumber } = useApp();

  const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
  const [teacherMode, setTeacherMode] = useState<'signup' | 'login' | 'forgot-password'>('signup');
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [createdUserName, setCreatedUserName] = useState('');

  // Teacher Form states
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [ecNumber, setEcNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Teacher Account Recovery / Forgot Password states
  const [recoveryEcNumber, setRecoveryEcNumber] = useState('');
  const [foundTeacher, setFoundTeacher] = useState<any | null>(null);
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [isVerifyingEc, setIsVerifyingEc] = useState(false);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  // Admin Login states (Admin has email and password ONLY)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjectsList = [
    'Mathematics',
    'English Language & Literature',
    'Integrated Science',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
    'Computer Science',
    'Accounts & Commerce',
    'Agriculture',
    'Shona',
    'Ndebele',
    'Physical Education & Sports',
    'Art & Design',
  ];

  // Teacher Sign-Up Submit
  const handleTeacherSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !surname.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (!ecNumber.trim()) {
      setErrorMsg('Please enter your EC Number (Employment Code).');
      return;
    }

    if (!subject.trim()) {
      setErrorMsg('Please enter or select your teaching subject.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerTeacher({
        name,
        surname,
        ecNumber,
        subject,
        email,
        password,
      });

      if (!result.success) {
        setErrorMsg(result.error || 'Failed to create account');
        setIsSubmitting(false);
        return;
      }

      setCreatedUserName(`${name} ${surname}`);
      setShowSuccessScreen(true);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#047857', '#10B981', '#F59E0B', '#3B82F6'],
      });
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Teacher Account Recovery: Verify EC Number
  const handleVerifyEcNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setRecoverySuccessMsg('');

    if (!recoveryEcNumber.trim()) {
      setErrorMsg('Please enter your EC Number (Employment Code).');
      return;
    }

    setIsVerifyingEc(true);
    triggerHaptic('light');

    try {
      const res = await findTeacherByEcNumber(recoveryEcNumber);
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'No teacher account found with this EC number.');
        setFoundTeacher(null);
        triggerHaptic('error');
      } else {
        setFoundTeacher(res.user);
        triggerHaptic('success');
      }
    } catch {
      setErrorMsg('Error verifying EC number. Please try again.');
      triggerHaptic('error');
    } finally {
      setIsVerifyingEc(false);
    }
  };

  // Teacher Account Recovery: Submit New Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!foundTeacher) {
      setErrorMsg('Please verify your EC Number first.');
      return;
    }

    if (!recoveryNewPassword.trim() || recoveryNewPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      const res = await resetTeacherPasswordWithEcNumber(recoveryEcNumber, recoveryNewPassword);
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Failed to update password.');
        triggerHaptic('error');
      } else {
        setRecoverySuccessMsg(`Password for ${res.user.name} ${res.user.surname} updated successfully!`);
        triggerHaptic('success');
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#047857', '#10B981', '#F59E0B'],
        });

        // Automatically log in with the new password after brief pause
        setTimeout(async () => {
          await loginUser(res.user!.email, recoveryNewPassword, 'teacher');
        }, 1400);
      }
    } catch {
      setErrorMsg('An unexpected error occurred while resetting password.');
      triggerHaptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Teacher Login Submit
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your teacher email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginUser(email, password, 'teacher');
      if (!result.success) {
        setErrorMsg(result.error || 'Invalid teacher credentials.');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg('An error occurred during login. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Admin Login Submit (Admin has password and email ONLY)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!adminEmail.trim()) {
      setErrorMsg('Please enter your administrative email address.');
      return;
    }

    if (!adminPassword.trim()) {
      setErrorMsg('Please enter your administrator password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginUser(adminEmail, adminPassword, 'admin');
      if (!result.success) {
        setErrorMsg(result.error || 'Invalid administrator credentials.');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg('An error occurred during administrator login. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleContinueToApp = () => {
    setShowSuccessScreen(false);
  };

  // 1. Account Created Screen for Teacher
  if (showSuccessScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 rounded-full border-2 border-emerald-500"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Created!
          </h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Your teacher account for{' '}
            <span className="font-semibold text-emerald-800">{createdUserName}</span>{' '}
            has been created successfully. You can now use the app.
          </p>

          <div className="bg-emerald-50 rounded-2xl p-4 mb-8 text-left border border-emerald-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Auto-Login Enabled
            </div>
            <p className="text-xs text-emerald-700">
              The next time you open the app, it will automatically log you in straight to your dashboard.
            </p>
          </div>

          <button
            id="continue-to-app-btn"
            onClick={handleContinueToApp}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg bg-emerald-700 hover:bg-emerald-800 shadow-emerald-200 transition duration-200 flex items-center justify-center gap-2"
          >
            <span>CONTINUE TO APP</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  // 2. Main Auth Screen
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Top Header with Dadaya High School Crest */}
        <div className="pt-8 pb-4 px-6 text-center bg-gradient-to-b from-emerald-50/60 to-white">
          <SchoolCrest size="lg" />
          <h1 className="mt-3 font-extrabold text-emerald-950 tracking-wide text-lg sm:text-xl uppercase">
            Dadaya High School
          </h1>
          <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
            Attendance System
          </p>
        </div>

        {/* Portal Switcher (Teacher vs Admin) */}
        <div className="px-6 pt-2 pb-1">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              id="role-teacher-tab"
              type="button"
              onClick={() => {
                setRole('teacher');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                role === 'teacher'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Teacher Portal</span>
            </button>
            <button
              id="role-admin-tab"
              type="button"
              onClick={() => {
                setRole('admin');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                role === 'admin'
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 pt-3">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ADMIN PORTAL: EMAIL AND PASSWORD ONLY FOR LOG IN (User Requirement)     */}
          {/* ========================================================================= */}
          {role === 'admin' ? (
            <div>
              <div className="mb-5 text-center">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Administrator Log In
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter your admin email and password to access the dashboard.
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                {/* Admin Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                    <input
                      id="admin-email-input"
                      type="email"
                      placeholder="admin@dadaya.co.zw"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-700/30 focus:border-blue-700 transition"
                    />
                  </div>
                </div>

                {/* Admin Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                    <input
                      id="admin-password-input"
                      type={showAdminPassword ? 'text' : 'password'}
                      placeholder="Enter administrator password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-700/30 focus:border-blue-700 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showAdminPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Admin Button */}
                <button
                  id="submit-admin-login-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-white text-sm shadow-md bg-blue-800 hover:bg-blue-900 active:bg-blue-950 shadow-blue-100 transition duration-150 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying Admin...' : 'LOG IN AS ADMIN'}</span>
                </button>
              </form>

              <div className="mt-6 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-gray-500 text-center">
                <p className="font-semibold text-gray-700">Dadaya High School Administration Portal</p>
                <p className="text-gray-500 mt-0.5">
                  Restricted to authorized headmasters and school leadership.
                </p>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* TEACHER PORTAL: SIGN UP (NAME, SURNAME, SUBJECT, EMAIL, PASSWORD) & LOGIN */
            /* ========================================================================= */
            <div>
              <div className="mb-5 text-center">
                <h2 className="text-lg font-bold text-gray-900">
                  {teacherMode === 'signup'
                    ? 'Create your teacher account'
                    : 'Welcome Back, Teacher'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {teacherMode === 'signup'
                    ? 'Please fill in your details to get started.'
                    : 'Enter your email and password to log in.'}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {teacherMode === 'signup' ? (
                  <motion.form
                    key="teacher-signup-form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleTeacherSignUp}
                    className="space-y-3.5"
                  >
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Name
                      </label>
                      <div className="relative flex items-center">
                        <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                        <input
                          id="teacher-name-input"
                          type="text"
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                        />
                      </div>
                    </div>

                    {/* Surname */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Surname
                      </label>
                      <div className="relative flex items-center">
                        <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                        <input
                          id="teacher-surname-input"
                          type="text"
                          placeholder="Enter your surname"
                          value={surname}
                          onChange={(e) => setSurname(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                        />
                      </div>
                    </div>

                    {/* EC Number (Employment Code Number) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        EC Number <span className="text-emerald-700 font-bold">(Employment Code)</span>
                      </label>
                      <div className="relative flex items-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 absolute left-3 pointer-events-none" />
                        <input
                          id="teacher-ec-number-input"
                          type="text"
                          placeholder="Enter your EC number (e.g. EC-748291)"
                          value={ecNumber}
                          onChange={(e) => setEcNumber(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition uppercase"
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Subject
                      </label>
                      <div className="relative flex items-center">
                        <BookOpen className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                        <input
                          id="teacher-subject-input"
                          type="text"
                          list="subjects-suggestions"
                          placeholder="Enter your teaching subject (e.g. Mathematics)"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                        />
                        <datalist id="subjects-suggestions">
                          {subjectsList.map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                        <input
                          id="teacher-email-input"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                        <input
                          id="teacher-password-input"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      id="submit-teacher-signup-btn"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-3 py-3 px-4 rounded-xl font-bold text-white text-sm shadow-md bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 shadow-emerald-100 transition duration-150 uppercase tracking-wider"
                    >
                      {isSubmitting ? 'Creating Account...' : 'SIGN UP'}
                    </button>
                  </motion.form>
                ) : teacherMode === 'login' ? (
                  <motion.form
                    key="teacher-login-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onSubmit={handleTeacherLogin}
                    className="space-y-4"
                  >
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Teacher Email Address
                      </label>
                      <div className="relative flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                        <input
                          id="teacher-login-email-input"
                          type="email"
                          placeholder="Enter your registered email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          Password
                        </label>
                        <button
                          id="forgot-password-btn"
                          type="button"
                          onClick={() => {
                            setTeacherMode('forgot-password');
                            setErrorMsg('');
                            setFoundTeacher(null);
                            setRecoverySuccessMsg('');
                            setRecoveryEcNumber('');
                            setRecoveryNewPassword('');
                            setRecoveryConfirmPassword('');
                          }}
                          className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                        <input
                          id="teacher-login-password-input"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      id="submit-teacher-login-btn"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-3 py-3 px-4 rounded-xl font-bold text-white text-sm shadow-md bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 shadow-emerald-100 transition duration-150 uppercase tracking-wider cursor-pointer"
                    >
                      {isSubmitting ? 'Signing in...' : 'LOG IN'}
                    </button>

                    {/* Quick EC Number Recovery Shortcut */}
                    <div className="pt-2 text-center">
                      <button
                        id="recover-via-ec-btn"
                        type="button"
                        onClick={() => {
                          setTeacherMode('forgot-password');
                          setErrorMsg('');
                          setFoundTeacher(null);
                          setRecoverySuccessMsg('');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-800 font-medium cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Recover teacher account using <strong>EC Number</strong></span>
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  /* Forgot Password / Account Recovery using EC Number */
                  <motion.div
                    key="teacher-recovery-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {/* Recovery Header */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                      <KeyRound className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                          Teacher Account Recovery
                        </h4>
                        <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">
                          Enter your official Dadaya High School <strong>EC Number</strong> (Employment Code) to verify your account and set a new password.
                        </p>
                      </div>
                    </div>

                    {/* Success Notice if reset */}
                    {recoverySuccessMsg && (
                      <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{recoverySuccessMsg} Logging you in...</span>
                      </div>
                    )}

                    {/* STEP 1: Verify EC Number */}
                    <form onSubmit={handleVerifyEcNumber} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Official EC Number / Employment Code
                        </label>
                        <div className="relative flex items-center">
                          <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                          <input
                            id="recovery-ec-number-input"
                            type="text"
                            placeholder="e.g. EC-748291 or 748291"
                            value={recoveryEcNumber}
                            onChange={(e) => {
                              setRecoveryEcNumber(e.target.value);
                              if (foundTeacher) setFoundTeacher(null);
                            }}
                            required
                            disabled={isVerifyingEc || !!foundTeacher}
                            className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition font-mono ${
                              foundTeacher ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200'
                            }`}
                          />
                        </div>
                      </div>

                      {!foundTeacher && (
                        <button
                          id="verify-ec-btn"
                          type="submit"
                          disabled={isVerifyingEc || !recoveryEcNumber.trim()}
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-white text-xs bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer uppercase tracking-wider"
                        >
                          {isVerifyingEc ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                              <span>Searching School Records...</span>
                            </>
                          ) : (
                            <>
                              <Search className="w-3.5 h-3.5" />
                              <span>Verify EC Number</span>
                            </>
                          )}
                        </button>
                      )}
                    </form>

                    {/* STEP 2: Found Teacher Verified Card */}
                    {foundTeacher && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                                {foundTeacher.name.charAt(0)}
                                {foundTeacher.surname.charAt(0)}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-900">
                                  {foundTeacher.name} {foundTeacher.surname}
                                </h5>
                                <p className="text-[11px] text-slate-500">
                                  {foundTeacher.subject || foundTeacher.department || 'Academic Staff'}
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                              <Check className="w-3 h-3 text-emerald-700" />
                              Verified
                            </span>
                          </div>
                          <div className="mt-2 text-[11px] text-slate-600 flex justify-between">
                            <span>Email: <strong className="text-slate-800">{foundTeacher.email}</strong></span>
                            <span>EC: <strong className="font-mono text-emerald-800">{foundTeacher.ecNumber || foundTeacher.employeeId}</strong></span>
                          </div>
                        </div>

                        {/* STEP 3: Enter New Password */}
                        <form onSubmit={handleResetPasswordSubmit} className="space-y-3 pt-1">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Enter New Password
                            </label>
                            <div className="relative flex items-center">
                              <Lock className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                              <input
                                id="recovery-new-password-input"
                                type={showRecoveryPassword ? 'text' : 'password'}
                                placeholder="Create a new password (min 4 chars)"
                                value={recoveryNewPassword}
                                onChange={(e) => setRecoveryNewPassword(e.target.value)}
                                required
                                minLength={4}
                                className="w-full pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                              />
                              <button
                                type="button"
                                onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                                className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                              >
                                {showRecoveryPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Confirm New Password
                            </label>
                            <div className="relative flex items-center">
                              <Lock className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                              <input
                                id="recovery-confirm-password-input"
                                type={showRecoveryPassword ? 'text' : 'password'}
                                placeholder="Re-enter your new password"
                                value={recoveryConfirmPassword}
                                onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                                required
                                minLength={4}
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                              />
                            </div>
                          </div>

                          <button
                            id="submit-reset-password-btn"
                            type="submit"
                            disabled={isSubmitting || !recoveryNewPassword}
                            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white text-sm shadow-md bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 shadow-emerald-100 transition duration-150 uppercase tracking-wider cursor-pointer"
                          >
                            {isSubmitting ? 'Updating Password...' : 'Save New Password & Log In'}
                          </button>
                        </form>
                      </motion.div>
                    )}

                    {/* Back to Login Button */}
                    <div className="pt-2 text-center">
                      <button
                        id="back-to-login-btn"
                        type="button"
                        onClick={() => {
                          setTeacherMode('login');
                          setErrorMsg('');
                          setFoundTeacher(null);
                          setRecoverySuccessMsg('');
                        }}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        ← Back to Teacher Login
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toggle between Sign Up and Login for Teachers */}
              <div className="mt-6 text-center text-xs text-gray-600">
                {teacherMode === 'signup' ? (
                  <p>
                    Already have a teacher account?{' '}
                    <button
                      id="toggle-teacher-login-btn"
                      type="button"
                      onClick={() => {
                        setTeacherMode('login');
                        setErrorMsg('');
                      }}
                      className="font-bold text-emerald-800 hover:text-emerald-950 underline ml-1 cursor-pointer"
                    >
                      Login
                    </button>
                  </p>
                ) : teacherMode === 'login' ? (
                  <p>
                    First time accessing the app?{' '}
                    <button
                      id="toggle-teacher-signup-btn"
                      type="button"
                      onClick={() => {
                        setTeacherMode('signup');
                        setErrorMsg('');
                      }}
                      className="font-bold text-emerald-800 hover:text-emerald-950 underline ml-1 cursor-pointer"
                    >
                      Create Teacher Account
                    </button>
                  </p>
                ) : (
                  <p>
                    Remembered your password?{' '}
                    <button
                      id="toggle-teacher-login-from-forgot-btn"
                      type="button"
                      onClick={() => {
                        setTeacherMode('login');
                        setErrorMsg('');
                        setFoundTeacher(null);
                      }}
                      className="font-bold text-emerald-800 hover:text-emerald-950 underline ml-1 cursor-pointer"
                    >
                      Back to Login
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Auth Page Footer Signature */}
        <div className="mt-6 text-center select-none">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <span>Dadaya High School Attendance Portal</span>
            <span>•</span>
            <span>Created by <strong className="text-emerald-800 font-bold">Nyasha Munda</strong></span>
          </p>
        </div>
      </div>
    </div>
  );
};
