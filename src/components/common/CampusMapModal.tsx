import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Navigation, Info } from 'lucide-react';
import { SchoolSettings } from '../../types';
import { SchoolCampusMap } from './SchoolCampusMap';

interface CampusMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolSettings: SchoolSettings;
  userCoords?: { latitude: number; longitude: number } | null;
  isSimulated?: boolean;
}

export const CampusMapModal: React.FC<CampusMapModalProps> = ({
  isOpen,
  onClose,
  schoolSettings,
  userCoords,
  isSimulated = false,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Dadaya High School Campus Map</h3>
                <p className="text-[11px] text-slate-500">
                  Google Maps Geofence: {schoolSettings.allowedRadiusMeters}m Allowed Radius
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Map Content */}
          <div className="p-4 flex-1 overflow-y-auto">
            <SchoolCampusMap
              schoolSettings={schoolSettings}
              userCoords={userCoords}
              height="380px"
              interactive={true}
              title="Campus Perimeter & Teacher Station"
              isSimulated={isSimulated}
            />

            <div className="mt-3 p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="leading-snug text-[11px]">
                <strong>Physical Geofence Verification:</strong> The school gate and faculty administration center are anchored at coordinates <strong>{schoolSettings.schoolLatitude.toFixed(6)}, {schoolSettings.schoolLongitude.toFixed(6)}</strong> in Zvishavane, Zimbabwe. Attendance clock-ins and clock-outs are authorized strictly when inside the active <strong>{schoolSettings.allowedRadiusMeters}m</strong> perimeter.
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close Map
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
