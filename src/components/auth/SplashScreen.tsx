import React from 'react';
import { motion } from 'motion/react';
import { SchoolCrest } from '../common/SchoolCrest';

interface SplashScreenProps {
  title?: string;
  subtitle?: string;
  role?: 'teacher' | 'admin';
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  title = 'DADAYA HIGH SCHOOL',
  subtitle = 'ATTENDANCE SYSTEM',
  role,
}) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center select-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center max-w-sm w-full"
      >
        <div className="relative mb-6">
          <SchoolCrest size="xl" />
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 -m-3 bg-emerald-100 rounded-full blur-xl -z-10"
          />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-emerald-950 uppercase">
          {title}
        </h1>
        <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase mt-1">
          {subtitle}
        </p>

        {role && (
          <span className="mt-3 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
            {role === 'admin' ? 'Administrative Portal' : 'Faculty & Staff Portal'}
          </span>
        )}

        <div className="mt-12 flex flex-col items-center">
          {/* Animated Loading Dots */}
          <div className="flex items-center gap-2 mb-3">
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"
            />
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"
            />
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"
            />
          </div>
          <p className="text-sm font-medium text-gray-500">
            Loading...
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Preparing your dashboard
          </p>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span>Created by</span>
            <span className="font-bold text-emerald-800">Nyasha Munda</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
