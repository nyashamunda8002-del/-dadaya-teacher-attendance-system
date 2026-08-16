import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  FileText,
  Send,
  UserCheck,
  Building2,
  Trash2,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LeaveType, LeaveRequest } from '../../types';

export const TeacherLeave: React.FC = () => {
  const { currentUser, leaveRequests, submitLeaveRequest, deleteLeaveRequest } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('sick');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [handoverDetails, setHandoverDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Filter leaves for this teacher
  const myLeaves = leaveRequests.filter((l) => l.userId === currentUser?.id);
  const filteredLeaves = myLeaves.filter((l) => {
    if (filterType === 'all') return true;
    return l.status === filterType;
  });

  const pendingCount = myLeaves.filter((l) => l.status === 'pending').length;
  const approvedCount = myLeaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = myLeaves.filter((l) => l.status === 'rejected').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!reason.trim()) {
      setFeedback({ text: 'Please provide a reason for the leave request.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const res = await submitLeaveRequest({
      userId: currentUser.id,
      teacherName: currentUser.name,
      teacherSurname: currentUser.surname,
      subject: currentUser.subject || 'General Academic',
      leaveType,
      startDate,
      endDate,
      totalDays: diffDays > 0 ? diffDays : 1,
      reason: reason.trim(),
      handoverDetails: handoverDetails.trim() || undefined,
    });

    setIsSubmitting(false);
    if (res.success) {
      setFeedback({
        text: 'Leave application submitted successfully. School Administration has been notified.',
        type: 'success',
      });
      setIsModalOpen(false);
      setReason('');
      setHandoverDetails('');
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ text: res.error || 'Failed to submit leave request.', type: 'error' });
    }
  };

  const getLeaveTypeBadge = (type: LeaveType) => {
    switch (type) {
      case 'sick':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Medical / Sick</span>;
      case 'annual':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Annual / Casual</span>;
      case 'maternity':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">Maternity / Parental</span>;
      case 'compassionate':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Compassionate</span>;
      case 'official_duty':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Official Duty / Workshop</span>;
      case 'study':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">Study / Exam</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">Other</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Leave & Absence Applications</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Submit time-off requests, sick leave notices, and official school duty applications
          </p>
        </div>
        <button
          id="btn-new-leave-app"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-2xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{approvedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Declined</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">{rejectedCount}</p>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-gray-900 text-sm">Application History</h3>
            <span className="text-xs text-gray-400">({filteredLeaves.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 font-medium text-gray-700"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Declined</option>
            </select>
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>No leave applications found in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeaves.map((leave) => (
              <div
                key={leave.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getLeaveTypeBadge(leave.leaveType)}
                    <span className="text-xs font-bold text-gray-900">
                      {leave.startDate} to {leave.endDate}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      ({leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'})
                    </span>
                  </div>
                  <div>{getStatusBadge(leave.status)}</div>
                </div>

                <p className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-100">
                  <strong className="text-gray-900">Reason: </strong> {leave.reason}
                </p>

                {leave.handoverDetails && (
                  <p className="text-xs text-gray-500 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                    <strong className="text-emerald-900">Class Coverage / Handover: </strong>{' '}
                    {leave.handoverDetails}
                  </p>
                )}

                {leave.adminNotes && (
                  <div className="text-xs p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-950 flex items-start gap-2">
                    <UserCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-900">Admin Feedback ({leave.reviewedBy || 'Principal'}):</p>
                      <p className="text-blue-800 mt-0.5">{leave.adminNotes}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>Submitted on {new Date(leave.submittedAt).toLocaleDateString()}</span>
                  {leave.status === 'pending' && (
                    <button
                      onClick={() => deleteLeaveRequest(leave.id)}
                      className="text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3 h-3" />
                      Withdraw Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Application Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Apply for Leave / Absence</h3>
                    <p className="text-[11px] text-gray-500">Dadaya High School Academic Staff Portal</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Leave Classification</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
                  >
                    <option value="sick">Medical / Sick Leave</option>
                    <option value="annual">Casual / Personal Leave</option>
                    <option value="compassionate">Compassionate Leave</option>
                    <option value="official_duty">Official School Duty / Educational Workshop</option>
                    <option value="maternity">Maternity / Paternity Leave</option>
                    <option value="study">Study / Examination Leave</option>
                    <option value="other">Other Absence</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Reason / Justification</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="Provide specific details regarding the leave request..."
                    rows={3}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Lesson Handover / Class Relief Plan <span className="font-normal text-gray-400">(Optional)</span>
                  </label>
                  <textarea
                    value={handoverDetails}
                    onChange={(e) => setHandoverDetails(e.target.value)}
                    placeholder="E.g., Form 3 Mathematics lessons covered by Mr. Sibanda..."
                    rows={2}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-gray-600 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
