import React, { useState } from 'react';
import { Phone, MessageSquare, Copy, Check, Headphones, Clock, ShieldCheck, X } from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HELP_CENTER_PHONE = '0711335606';
export const HELP_CENTER_PHONE_INTL = '+263711335606';

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(HELP_CENTER_PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
              <Headphones className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Dadaya High School</span>
              <h3 className="text-xl font-bold">Contact Help Center</h3>
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed mt-1">
            Official technical support, geofence calibration assistance, and staff attendance helpdesk.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Direct Number Display */}
          <div className="bg-emerald-50/80 border-2 border-emerald-500/30 rounded-xl p-4 text-center">
            <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider mb-1">Direct Help Center Hotline</p>
            <div className="text-3xl font-black text-emerald-900 tracking-wide font-mono my-1">
              {HELP_CENTER_PHONE}
            </div>
            <p className="text-xs text-slate-500">Available Monday – Friday • 06:30 – 17:30 CAT</p>

            <button
              onClick={handleCopy}
              className="mt-3 inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-white rounded-lg border border-emerald-200 hover:bg-emerald-100/60 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Number Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Phone Number</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`tel:${HELP_CENTER_PHONE}`}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Call Now</span>
            </a>

            <a
              href={`https://wa.me/263711335606?text=Hello%20Dadaya%20Help%20Center,%20I%20need%20assistance%20with%20attendance`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Info points */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Immediate assistance for clocking reminders, GPS boundaries, or class attendance recording.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Managed by Dadaya High School System Administration (Zvishavane).</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
