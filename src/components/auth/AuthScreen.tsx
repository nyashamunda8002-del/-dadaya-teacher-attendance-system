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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from '../common/SchoolCrest';

export const AuthScreen: React.FC = () => {
  const { registerTeacher, loginUser } = useApp();

  const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
  const [teacherMode, setTeacherMode] = useState<'signup' | 'login'>('signup');
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
                ) : (
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
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Password
                      </label>
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
                      className="w-full mt-3 py-3 px-4 rounded-xl font-bold text-white text-sm shadow-md bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 shadow-emerald-100 transition duration-150 uppercase tracking-wider"
                    >
                      {isSubmitting ? 'Signing in...' : 'LOG IN'}
                    </button>
                  </motion.form>
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
                      className="font-bold text-emerald-800 hover:text-emerald-950 underline ml-1"
                    >
                      Login
                    </button>
                  </p>
                ) : (
                  <p>
                    First time accessing the app?{' '}
                    <button
                      id="toggle-teacher-signup-btn"
                      type="button"
                      onClick={() => {
                        setTeacherMode('signup');
                        setErrorMsg('');
                      }}
                      className="font-bold text-emerald-800 hover:text-emerald-950 underline ml-1"
                    >
                      Create Teacher Account
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
