import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Clock, Send, X, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface EarlyClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'early_in' | 'early_out';
  onConfirm: (reason: string) => void;
}

export const EarlyClockModal: React.FC<EarlyClockModalProps> = ({
  isOpen,
  onClose,
  type,
  onConfirm,
}) => {
  const { currentUser } = useApp();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const title =
    type === 'early_in'
      ? 'Early Clock In Notice'
      : 'Early Departure / Clock Out Notice';

  const subtitle =
    type === 'early_in'
      ? 'You are clocking in ahead of regular school arrival hours. Please provide a reason for the administration records.'
      : 'You are clocking out before standard dismissal hours. Please submit your departure reason for administrative record and approval.';

  const quickReasons =
    type === 'early_in'
      ? [
          'Morning Study Duty & Supervision',
          'Early Sports / Athletic Coaching',
          'Science Lab / Classroom Setup',
          'Exam Paper Preparation',
          'Parent-Teacher Morning Conference',
          'Emergency Staff Meeting',
        ]
      : [
          'Official School Duty / Interschool Event',
          'Medical Appointment / Health Emergency',
          'Urgent Family Emergency',
          'Sports Team Travel / Supervision',
          'Authorized External Workshop',
        ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason to notify the admin.');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{title}</h3>
              <p className="text-amber-100 text-xs font-medium">
                Admin Notification System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-amber-50 rounded-2xl p-3.5 mb-4 border border-amber-200/80 flex items-start gap-3 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium leading-relaxed">{subtitle}</p>
              <p className="mt-1 text-[11px] text-amber-700 font-semibold">
                This notice will immediately notify the Dadaya Administration dashboard with your name ({currentUser?.name} {currentUser?.surname}) and subject ({currentUser?.subject || 'Teacher'}).
              </p>
            </div>
          </div>

          {/* Quick Select Chips */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
              Quick Select Reason
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickReasons.map((qr) => (
                <button
                  type="button"
                  key={qr}
                  onClick={() => setReason(qr)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition font-medium text-left ${
                    reason === qr
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Text Area */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Detailed Reason / Note <span className="text-red-500">*</span>
            </label>
            <textarea
              id="early-clock-reason-input"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Supervising Form 4 mock physics exam preparations..."
              className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
            {error && <p className="text-red-600 text-xs mt-1 font-medium">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              id="submit-early-notice-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-200 flex items-center gap-2 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit & Notify Admin</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
