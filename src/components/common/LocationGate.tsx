import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  ShieldAlert,
  Compass,
  RefreshCw,
  CheckCircle2,
  Lock,
  Smartphone,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { SchoolCrest } from './SchoolCrest';
import { triggerHaptic } from '../../utils/haptics';

interface LocationGateProps {
  children: React.ReactNode;
  onLocationVerified?: (coords: { latitude: number; longitude: number; accuracy: number }) => void;
}

export const LocationGate: React.FC<LocationGateProps> = ({ children, onLocationVerified }) => {
  const [locationStatus, setLocationStatus] = useState<'checking' | 'prompt' | 'granted' | 'denied' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Core function to test and request location
  const verifyLocation = useCallback((isUserInitiated = false) => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setErrorMessage('Geolocation is not supported by your device or browser.');
      return;
    }

    if (isUserInitiated) {
      setIsRequesting(true);
      triggerHaptic('medium');
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCoords(newCoords);
        setLocationStatus('granted');
        setIsRequesting(false);
        setErrorMessage('');
        triggerHaptic('success');
        if (onLocationVerified) {
          onLocationVerified(newCoords);
        }
      },
      (error) => {
        setIsRequesting(false);
        triggerHaptic('error');
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
          setErrorMessage('Location permission was denied. The Dadaya High School portal requires active device GPS to function.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationStatus('error');
          setErrorMessage('GPS position unavailable. Please ensure device Location / GPS services are toggled on.');
        } else if (error.code === error.TIMEOUT) {
          setLocationStatus('error');
          setErrorMessage('GPS location request timed out. Please tap retry.');
        } else {
          setLocationStatus('error');
          setErrorMessage(error.message || 'Unable to retrieve location coordinates.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000,
      }
    );
  }, [onLocationVerified]);

  // Initial check on mount: check if permission already granted
  useEffect(() => {
    let watchId: number | null = null;

    if (!navigator.geolocation) {
      setLocationStatus('error');
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            verifyLocation(false);
          } else if (result.state === 'denied') {
            setLocationStatus('denied');
            setErrorMessage('Location access is blocked in your browser settings.');
          } else {
            // Prompt state: show the clear location requirement screen
            setLocationStatus('prompt');
          }

          result.onchange = () => {
            if (result.state === 'granted') {
              verifyLocation(false);
            } else if (result.state === 'denied') {
              setLocationStatus('denied');
            } else {
              setLocationStatus('prompt');
            }
          };
        })
        .catch(() => {
          // If query fails, attempt direct silent verification
          verifyLocation(false);
        });
    } else {
      // Fallback for browsers without permissions API
      verifyLocation(false);
    }

    // Set up continuous watch position if location is granted to detect if GPS is turned off
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setLocationStatus('granted');
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setLocationStatus('denied');
          }
        },
        { enableHighAccuracy: true, maximumAge: 15000 }
      );
    } catch {}

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [verifyLocation]);

  // If location is granted and verified, render the application seamlessly!
  if (locationStatus === 'granted' && coords) {
    return <>{children}</>;
  }

  // Otherwise, render the mandatory Location Gate Screen
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden select-none">
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-center"
      >
        {/* Crest & Institution Header */}
        <div className="flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl shadow-md mb-3">
            <SchoolCrest size="md" />
          </div>
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wider text-emerald-400">
            Dadaya High School
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
            Attendance Portal
          </p>
        </div>

        {/* GPS Gate Icon Indicator */}
        <div className="my-6 relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-950/80 border-2 border-emerald-500/30 flex items-center justify-center relative">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.6, 0.1, 0.6],
              }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              className="absolute inset-0 rounded-full border-2 border-emerald-400"
            />
            {locationStatus === 'denied' ? (
              <ShieldAlert className="w-9 h-9 text-rose-400" />
            ) : locationStatus === 'error' ? (
              <AlertTriangle className="w-9 h-9 text-amber-400" />
            ) : (
              <Compass className={`w-9 h-9 text-emerald-400 ${isRequesting ? 'animate-spin' : ''}`} />
            )}
          </div>
        </div>

        {/* Title & Security Explainer */}
        <div className="space-y-2 mb-6">
          <h2 className="text-xl font-bold text-white">
            {locationStatus === 'denied'
              ? 'Location Permission Denied'
              : locationStatus === 'error'
              ? 'GPS Signal Required'
              : 'Location Access Required'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dadaya High School attendance policies require verified device GPS access to validate physical presence within the official campus geofence boundary.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/90 text-emerald-300 border border-emerald-800/60 rounded-full text-[11px] font-semibold mt-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>The portal is locked until location is enabled</span>
          </div>
        </div>

        {/* Error / Status alert banner if denied or error */}
        {errorMessage && (
          <div className={`mb-5 p-3 rounded-2xl text-xs text-left flex items-start gap-2.5 border ${
            locationStatus === 'denied'
              ? 'bg-rose-950/50 border-rose-800/60 text-rose-200'
              : 'bg-amber-950/50 border-amber-800/60 text-amber-200'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                {locationStatus === 'denied' ? 'Permission Blocked' : 'GPS Verification Error'}
              </span>
              <p className="text-[11px] opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Main Action Button */}
        <div className="space-y-3">
          <button
            id="allow-location-btn"
            onClick={() => verifyLocation(true)}
            disabled={isRequesting}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-slate-950 bg-linear-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 active:scale-[0.98] shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            {isRequesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking Device GPS...</span>
              </>
            ) : locationStatus === 'denied' ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Re-Check Location Access</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>Allow Location to Open App</span>
              </>
            )}
          </button>

          {/* Toggle Instructions button */}
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-xs text-slate-400 hover:text-slate-200 underline flex items-center justify-center gap-1 mx-auto"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showInstructions ? 'Hide Instructions' : 'How to enable location on your phone/browser'}</span>
          </button>
        </div>

        {/* Step-by-step instructions accordion */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-700/80 text-left text-xs space-y-3 text-slate-300"
            >
              <div className="flex items-start gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">On Android / Mobile Chrome:</strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    1. Tap the <strong>Site Settings / Lock / Tune icon</strong> beside the address bar.<br />
                    2. Tap <strong>Permissions</strong> or <strong>Location</strong>.<br />
                    3. Switch to <strong>Allow</strong> and tap "Re-Check Location Access".
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                <Compass className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">On iPhone / Safari / Desktop:</strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    1. Ensure Device Location / GPS is turned ON in Settings.<br />
                    2. Click "Allow" on the browser prompt when prompted.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Signature */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <span>Dadaya High School Campus Perimeter Security</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">100m Geofence Enforced</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
