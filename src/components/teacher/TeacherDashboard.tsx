import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Calendar,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Building2,
  TrendingUp,
  Navigation,
  RefreshCw,
  Lock,
  Radio,
  CreditCard,
  QrCode,
  CalendarDays,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EarlyClockModal } from './EarlyClockModal';

export const TeacherDashboard: React.FC = () => {
  const {
    currentUser,
    todayRecord,
    clockIn,
    clockOut,
    clockInWithBadge,
    schoolSettings,
    attendanceRecords,
    setActiveView,
    leaveRequests,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [modalType, setModalType] = useState<'early_in' | 'early_out' | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [badgeInput, setBadgeInput] = useState('');
  const [badgeScanning, setBadgeScanning] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Location and Geofencing state
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: schoolSettings.schoolLatitude,
    lng: schoolSettings.schoolLongitude,
  });
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [locationMode, setLocationMode] = useState<'on_campus' | 'off_campus' | 'live_gps'>('on_campus');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Real-time digital clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatically acquire and monitor live device GPS to enforce automatic geofence lock
  useEffect(() => {
    if (!navigator.geolocation) return;

    let watchId: number | null = null;
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ lat, lng });
          setLocationMode('live_gps');
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
      );

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ lat, lng });
          setLocationMode('live_gps');
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    } catch (e) {
      console.warn('Geolocation setup notice:', e);
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Haversine formula to compute distance in meters
  const computeDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const formatCoord = (lat: number, lng: number) => {
    const latStr = `${Math.abs(lat).toFixed(5)}° ${lat < 0 ? 'S' : 'N'}`;
    const lngStr = `${Math.abs(lng).toFixed(5)}° ${lng < 0 ? 'W' : 'E'}`;
    return `${latStr}, ${lngStr}`;
  };

  // Re-calculate distance whenever coordinates or school settings change
  useEffect(() => {
    const dist = computeDistance(
      currentCoords.lat,
      currentCoords.lng,
      schoolSettings.schoolLatitude,
      schoolSettings.schoolLongitude
    );
    setDistanceMeters(dist);
  }, [currentCoords, schoolSettings.schoolLatitude, schoolSettings.schoolLongitude]);

  const isWithinCampus = distanceMeters <= schoolSettings.allowedRadiusMeters;

  // Real device GPS verification
  const handleVerifyGPS = () => {
    if (!navigator.geolocation) {
      setFeedbackMsg({
        text: 'GPS geolocation is not supported in this browser. Running in campus geofence mode.',
        type: 'info',
      });
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });
        setLocationMode('live_gps');

        const dist = computeDistance(
          lat,
          lng,
          schoolSettings.schoolLatitude,
          schoolSettings.schoolLongitude
        );
        setDistanceMeters(dist);

        const schoolCoordStr = formatCoord(schoolSettings.schoolLatitude, schoolSettings.schoolLongitude);
        if (dist <= schoolSettings.allowedRadiusMeters) {
          setFeedbackMsg({
            text: `GPS Verified! You are on Dadaya High School campus (${dist}m from perimeter, ${schoolCoordStr}).`,
            type: 'success',
          });
        } else {
          const distStr = dist >= 1000 ? `${(dist / 1000).toFixed(2)} km` : `${dist}m`;
          setFeedbackMsg({
            text: `Location Alert: Device GPS indicates you are ${distStr} away from Dadaya High School. Clocking is locked until you are within ${schoolSettings.allowedRadiusMeters}m of campus.`,
            type: 'error',
          });
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationError(
          err.code === 1
            ? 'Location permission denied. Please allow GPS access in your browser settings to verify you are on school grounds.'
            : 'Could not acquire precise GPS fix. Ensure location services are turned on.'
        );
        setFeedbackMsg({
          text: 'Device GPS unavailable. Please enable location permission or verify campus mode.',
          type: 'info',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Location switchers (for simulation & verification in cloud/preview environments)
  const setCampusLocation = () => {
    setCurrentCoords({
      lat: schoolSettings.schoolLatitude + 0.0001, // ~11 meters from school center
      lng: schoolSettings.schoolLongitude + 0.0001,
    });
    setLocationMode('on_campus');
    setLocationError(null);
    setFeedbackMsg({
      text: 'Verified at Dadaya High School Campus. Clocking is enabled.',
      type: 'success',
    });
  };

  const setOffCampusLocation = () => {
    setCurrentCoords({
      lat: schoolSettings.schoolLatitude + 0.05, // ~5.5 km away (e.g. Zvishavane town center)
      lng: schoolSettings.schoolLongitude + 0.05,
    });
    setLocationMode('off_campus');
    setLocationError(null);
    setFeedbackMsg({
      text: 'Simulated Off-Campus Location (~7.5 km away). Clocking is strictly blocked.',
      type: 'error',
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const handleClockInClick = async () => {
    // Strictly verify location first
    if (!isWithinCampus) {
      const distStr = distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(2)} km` : `${distanceMeters}m`;
      setFeedbackMsg({
        text: `Clock-In Blocked: You are currently ${distStr} away from Dadaya High School. Teachers must be physically located within ${schoolSettings.allowedRadiusMeters}m of the campus perimeter to clock in.`,
        type: 'error',
      });
      return;
    }

    const hours = currentTime.getHours();
    const mins = currentTime.getMinutes();
    // Check if early clock in (before 07:15)
    const isEarly = hours < 7 || (hours === 7 && mins < 15);

    if (isEarly) {
      setModalType('early_in');
    } else {
      const res = await clockIn(undefined, false, {
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
      });
      setFeedbackMsg({
        text: res.message,
        type: res.success ? 'success' : 'error',
      });
    }
  };

  const handleClockOutClick = async () => {
    // Strictly verify location first
    if (!isWithinCampus) {
      const distStr = distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(2)} km` : `${distanceMeters}m`;
      setFeedbackMsg({
        text: `Clock-Out Blocked: You are currently ${distStr} away from Dadaya High School. Teachers must be physically located within ${schoolSettings.allowedRadiusMeters}m of the campus perimeter to clock out.`,
        type: 'error',
      });
      return;
    }

    const hours = currentTime.getHours();
    const mins = currentTime.getMinutes();
    // Check if early clock out (before 15:15)
    const isEarly = hours < 15 || (hours === 15 && mins < 15);

    if (isEarly) {
      setModalType('early_out');
    } else {
      const res = await clockOut(undefined, false, {
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
      });
      setFeedbackMsg({
        text: res.message,
        type: res.success ? 'success' : 'error',
      });
    }
  };

  const handleConfirmEarlyAction = async (reason: string) => {
    if (!isWithinCampus) {
      setFeedbackMsg({
        text: 'Action Blocked: You are not within the Dadaya High School campus boundary.',
        type: 'error',
      });
      setModalType(null);
      return;
    }

    if (modalType === 'early_in') {
      const res = await clockIn(reason, true, {
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
      });
      setFeedbackMsg({
        text: res.message,
        type: res.success ? 'success' : 'error',
      });
    } else if (modalType === 'early_out') {
      const res = await clockOut(reason, true, {
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
      });
      setFeedbackMsg({
        text: res.message,
        type: res.success ? 'success' : 'error',
      });
    }
    setModalType(null);
  };

  // Badge / NFC Scan handler
  const handleBadgeScan = async (employeeIdOrEmail: string) => {
    if (!isWithinCampus) {
      setFeedbackMsg({
        text: 'Badge scan blocked: Device is not within Dadaya High School campus.',
        type: 'error',
      });
      return;
    }

    setBadgeScanning(true);
    const res = await clockInWithBadge(employeeIdOrEmail, {
      latitude: currentCoords.lat,
      longitude: currentCoords.lng,
    });
    setBadgeScanning(false);
    setIsBadgeModalOpen(false);
    setBadgeInput('');

    setFeedbackMsg({
      text: res.message,
      type: res.success ? 'success' : 'error',
    });
  };

  // Compute teacher personal stats
  const myRecords = attendanceRecords.filter((r) => r.userId === currentUser?.id);
  const presentDays = myRecords.filter((r) => r.status === 'present' || r.status === 'early_departure').length;
  const lateDays = myRecords.filter((r) => r.status === 'late').length;
  const totalLoggedMinutes = myRecords.reduce((acc, r) => acc + (r.totalWorkingMinutes || 0), 0);
  const totalHoursFormatted = `${Math.floor(totalLoggedMinutes / 60)}h ${totalLoggedMinutes % 60}m`;

  const myLeaves = leaveRequests.filter((l) => l.userId === currentUser?.id);
  const activePendingLeaves = myLeaves.filter((l) => l.status === 'pending').length;
  const approvedLeaves = myLeaves.filter((l) => l.status === 'approved').length;

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* Toast Feedback Alert */}
      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : feedbackMsg.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="leading-snug">{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-[10px] font-bold uppercase underline ml-2 opacity-75 hover:opacity-100 shrink-0"
          >
            OK
          </button>
        </motion.div>
      )}

      {/* Teacher Greeting & Digital Clock Banner */}
      <div className="bg-linear-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white rounded-3xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-700/90 border-2 border-emerald-400/40 flex items-center justify-center text-white text-base sm:text-lg font-black shadow-inner shrink-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span>
                  {currentUser?.name?.[0]}
                  {currentUser?.surname?.[0]}
                </span>
              )}
            </div>

            {/* Name & Role Tags */}
            <div className="text-left">
              <p className="text-emerald-300 text-[11px] font-medium">
                {getGreeting()}
              </p>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                {currentUser?.name} {currentUser?.surname}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {currentUser?.subject && (
                  <span className="px-2 py-0.2 bg-teal-800/80 border border-teal-500/30 rounded-md text-[10px] font-semibold text-teal-200">
                    {currentUser.subject}
                  </span>
                )}
                <span className="px-2 py-0.2 bg-white/10 rounded-md text-[10px] text-emerald-100 font-mono">
                  {currentUser?.employeeId || 'DHS-T001'}
                </span>
              </div>
            </div>
          </div>

          {/* Live School Clock */}
          <div className="bg-black/30 backdrop-blur-xs px-3 py-2 rounded-2xl border border-white/10 text-right shrink-0">
            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-300 block">
              School Time
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-white tracking-wide">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Campus Geofence Status Pill & Verification Bar */}
      <div className={`p-3 rounded-2xl border transition-all ${
        isWithinCampus
          ? 'bg-emerald-50/90 border-emerald-200'
          : 'bg-rose-50 border-rose-200'
      }`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              isWithinCampus ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-ping'
            }`} />
            <div className="text-xs">
              <span className={`font-bold ${isWithinCampus ? 'text-emerald-950' : 'text-rose-950'}`}>
                {isWithinCampus ? '✓ On Campus' : '⚠️ Off Campus (Locked)'}
              </span>
              <span className="text-[11px] text-gray-500 ml-1.5 hidden sm:inline">
                • {schoolSettings.schoolName} ({distanceMeters}m)
              </span>
            </div>
          </div>

          {/* Location Actions: Verify GPS / Test Toggle */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={handleVerifyGPS}
              disabled={isLocating}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 transition shadow-2xs"
              title="Acquire live device GPS"
            >
              <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin text-emerald-300' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Verify GPS'}</span>
            </button>

            {/* Quick Simulation switcher for preview/testing */}
            <button
              onClick={isWithinCampus ? setOffCampusLocation : setCampusLocation}
              className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                isWithinCampus
                  ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  : 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
              }`}
              title="Toggle simulated location for testing"
            >
              {isWithinCampus ? 'Simulate Off-Campus' : 'Simulate On-Campus'}
            </button>
          </div>
        </div>
      </div>

      {/* Today's Times & Primary Clock Action Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Today's Attendance</h2>
            <p className="text-[11px] text-gray-500">
              Hours: {schoolSettings.standardClockInTime} AM – {schoolSettings.standardClockOutTime} PM
            </p>
          </div>

          {todayRecord?.status ? (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                todayRecord.status === 'present'
                  ? 'bg-emerald-100 text-emerald-800'
                  : todayRecord.status === 'late'
                  ? 'bg-amber-100 text-amber-800'
                  : todayRecord.status === 'early_departure'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {todayRecord.status.replace('_', ' ')}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              Not Clocked In
            </span>
          )}
        </div>

        {/* 2-Column Time Display */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Clock In
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-900 block mt-0.5">
              {todayRecord?.clockInTime || '--:--'}
            </span>
            {todayRecord?.isEarlyClockIn && (
              <span className="inline-block mt-0.5 text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full font-semibold">
                Early In
              </span>
            )}
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Clock Out
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-gray-800 block mt-0.5">
              {todayRecord?.clockOutTime || '--:--'}
            </span>
            {todayRecord?.isEarlyClockOut && (
              <span className="inline-block mt-0.5 text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full font-semibold">
                Early Out
              </span>
            )}
          </div>
        </div>

        {/* Primary Thumb-Friendly Action Button */}
        <div>
          {!isWithinCampus && (
            <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-950">
              <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Clocking Buttons Automatically Locked</span>
                <p className="text-[11px] text-rose-800 leading-snug mt-0.5">
                  You are currently {distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(2)} km` : `${distanceMeters}m`} away from Dadaya High School. Attendance clocking is automatically locked until you arrive on school premises (within {schoolSettings.allowedRadiusMeters}m perimeter).
                </p>
              </div>
            </div>
          )}

          {!todayRecord?.clockInTime ? (
            <button
              id="clock-in-btn"
              onClick={handleClockInClick}
              disabled={!isWithinCampus}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide shadow-md transition duration-150 flex items-center justify-center gap-2 uppercase ${
                isWithinCampus
                  ? 'bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white shadow-emerald-200 cursor-pointer'
                  : 'bg-slate-200 border-2 border-dashed border-rose-300 text-rose-700 cursor-not-allowed shadow-none'
              }`}
            >
              {isWithinCampus ? (
                <>
                  <Clock className="w-5 h-5" />
                  <span>Clock In (Dadaya High)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>Clock In Locked (Off-Campus: {distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)}km` : `${distanceMeters}m`})</span>
                </>
              )}
            </button>
          ) : !todayRecord?.clockOutTime ? (
            <button
              id="clock-out-btn"
              onClick={handleClockOutClick}
              disabled={!isWithinCampus}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide shadow-md transition duration-150 flex items-center justify-center gap-2 uppercase ${
                isWithinCampus
                  ? 'bg-rose-700 hover:bg-rose-800 active:scale-[0.98] text-white shadow-rose-200 cursor-pointer'
                  : 'bg-slate-200 border-2 border-dashed border-rose-300 text-rose-700 cursor-not-allowed shadow-none'
              }`}
            >
              {isWithinCampus ? (
                <>
                  <Clock className="w-5 h-5" />
                  <span>Clock Out</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>Clock Out Locked (Off-Campus: {distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)}km` : `${distanceMeters}m`})</span>
                </>
              )}
            </button>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-emerald-900 font-semibold text-xs">
              ✓ Today's attendance complete • Duration:{' '}
              <span className="font-mono font-bold">
                {todayRecord.totalWorkingMinutes
                  ? `${Math.floor(todayRecord.totalWorkingMinutes / 60)}h ${todayRecord.totalWorkingMinutes % 60}m`
                  : 'N/A'}
              </span>
            </div>
          )}
        </div>

        {/* Fast ID / NFC Badge Scan Trigger */}
        <button
          id="badge-scan-trigger-btn"
          type="button"
          disabled={!isWithinCampus}
          onClick={() => {
            if (!isWithinCampus) {
              setFeedbackMsg({
                text: 'Badge Clocking Locked: You must be on Dadaya High School campus to scan your staff ID.',
                type: 'error',
              });
              return;
            }
            setIsBadgeModalOpen(true);
          }}
          className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-2 ${
            isWithinCampus
              ? 'border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 cursor-pointer'
              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isWithinCampus ? (
            <CreditCard className="w-4 h-4 text-purple-700" />
          ) : (
            <Lock className="w-4 h-4 text-slate-400" />
          )}
          <span>{isWithinCampus ? 'Tap Staff ID / NFC Badge' : 'Staff ID / Badge Tap (Locked Off-Campus)'}</span>
          {isWithinCampus && (
            <span className="px-1.5 py-0.2 rounded-md text-[9px] bg-purple-200 text-purple-900 uppercase font-black">
              Instant
            </span>
          )}
        </button>

        {/* Early Arrival / Departure Notice Trigger */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={!isWithinCampus}
            onClick={() => {
              if (!isWithinCampus) {
                setFeedbackMsg({
                  text: 'Cannot submit notice: You must be at Dadaya High School.',
                  type: 'error',
                });
                return;
              }
              setModalType('early_in');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl border font-semibold text-[11px] transition flex items-center justify-center gap-1.5 ${
              isWithinCampus
                ? 'border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 cursor-pointer'
                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isWithinCampus ? (
              <Send className="w-3 h-3 text-amber-700 shrink-0" />
            ) : (
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            )}
            <span className="truncate">{isWithinCampus ? 'Early Arrival Reason' : 'Early Arrival (Locked)'}</span>
          </button>

          <button
            type="button"
            disabled={!isWithinCampus}
            onClick={() => {
              if (!isWithinCampus) {
                setFeedbackMsg({
                  text: 'Cannot submit notice: You must be at Dadaya High School.',
                  type: 'error',
                });
                return;
              }
              setModalType('early_out');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl border font-semibold text-[11px] transition flex items-center justify-center gap-1.5 ${
              isWithinCampus
                ? 'border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 cursor-pointer'
                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isWithinCampus ? (
              <Send className="w-3 h-3 text-amber-700 shrink-0" />
            ) : (
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            )}
            <span className="truncate">{isWithinCampus ? 'Early Departure Reason' : 'Early Departure (Locked)'}</span>
          </button>
        </div>
      </div>

      {/* Teacher Quick Stats in Clean Micro Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] font-bold text-gray-500 block">Present</span>
          <p className="text-xl font-black text-emerald-800 mt-0.5">{presentDays}</p>
          <span className="text-[9px] text-gray-400">Sessions</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] font-bold text-gray-500 block">Late</span>
          <p className="text-xl font-black text-amber-600 mt-0.5">{lateDays}</p>
          <span className="text-[9px] text-gray-400">&gt; 07:45 AM</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] font-bold text-gray-500 block">Logged</span>
          <p className="text-xl font-black font-mono text-teal-800 mt-0.5">{totalHoursFormatted}</p>
          <span className="text-[9px] text-gray-400">Total Hours</span>
        </div>
      </div>

      {/* Leave & Absence Banner Card */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900">Leave & Absence</h3>
            <p className="text-[11px] text-gray-500">
              {activePendingLeaves > 0
                ? `${activePendingLeaves} pending request(s) under review`
                : `${approvedLeaves} approved leave record(s)`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveView('leave')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition inline-flex items-center gap-1 shrink-0"
        >
          <span>Apply</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Early Clock Reason Modal */}
      {modalType && (
        <EarlyClockModal
          isOpen={!!modalType}
          type={modalType}
          onClose={() => setModalType(null)}
          onConfirm={handleConfirmEarlyAction}
        />
      )}

      {/* NFC / ID Badge Fast Scan Modal */}
      {isBadgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden p-5 text-center space-y-3.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900">Scan Staff ID / NFC Badge</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Instant clocking with verified campus location
              </p>
              {!isWithinCampus && (
                <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-semibold flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Device is Off-Campus. Badge scan locked.</span>
                </div>
              )}
            </div>

            {/* Quick Tap My Badge Preset */}
            <div className="p-2.5 bg-purple-50/70 border border-purple-100 rounded-xl text-left flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-950">
                  {currentUser?.name} {currentUser?.surname}
                </p>
                <p className="text-[10px] font-mono text-purple-700">
                  ID: {currentUser?.employeeId || 'DHS-T001'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleBadgeScan(currentUser?.employeeId || currentUser?.email || '')}
                disabled={badgeScanning || !isWithinCampus}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-2xs transition disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {!isWithinCampus && <Lock className="w-3 h-3" />}
                <span>{badgeScanning ? 'Tapping...' : !isWithinCampus ? 'Locked' : 'Tap Badge'}</span>
              </button>
            </div>

            {/* Manual ID Input */}
            <div className="text-left space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 block">
                Or Enter Staff ID / Barcode:
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. DHS-T001"
                  value={badgeInput}
                  disabled={!isWithinCampus}
                  onChange={(e) => setBadgeInput(e.target.value)}
                  className="flex-1 p-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && badgeInput.trim() && isWithinCampus) {
                      handleBadgeScan(badgeInput.trim());
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => badgeInput.trim() && handleBadgeScan(badgeInput.trim())}
                  disabled={!badgeInput.trim() || badgeScanning || !isWithinCampus}
                  className="px-3 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Scan
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsBadgeModalOpen(false);
                  setBadgeInput('');
                }}
                className="w-full py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
