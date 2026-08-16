import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Check,
  X,
  MessageSquare,
  Search,
  Filter,
  Users,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LeaveType, LeaveRequest, LeaveStatus } from '../../types';

export const AdminLeaveManagement: React.FC = () => {
  const { leaveRequests, updateLeaveStatus, deleteLeaveRequest } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredLeaves = leaveRequests.filter((leave) => {
    const matchesSearch =
      leave.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.teacherSurname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || leave.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = leaveRequests.filter((l) => l.status === 'pending').length;
  const approvedCount = leaveRequests.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaveRequests.filter((l) => l.status === 'rejected').length;

  const handleOpenActionModal = (leave: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedLeave(leave);
    setActionType(action);
    setAdminNoteInput(
      action === 'approve'
        ? 'Leave approved by Administration. Please ensure class coverage is confirmed.'
        : 'Leave request declined due to critical timetable duties.'
    );
  };

  const handleConfirmAction = async () => {
    if (!selectedLeave || !actionType) return;
    const newStatus: LeaveStatus = actionType === 'approve' ? 'approved' : 'rejected';
    await updateLeaveStatus(selectedLeave.id, newStatus, adminNoteInput.trim());

    setFeedback(`Leave application for ${selectedLeave.teacherName} ${selectedLeave.teacherSurname} ${newStatus}.`);
    setSelectedLeave(null);
    setActionType(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const getLeaveTypeBadge = (type: LeaveType) => {
    switch (type) {
      case 'sick':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Sick Leave</span>;
      case 'annual':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Casual / Annual</span>;
      case 'maternity':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">Maternity</span>;
      case 'compassionate':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Compassionate</span>;
      case 'official_duty':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Official Duty</span>;
      case 'study':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">Study Leave</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">Other</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Faculty Leave & Absence Requests</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review, approve, and manage official absence applications submitted by teachers
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              {pendingCount} Pending Review
            </span>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Pending Action</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Approved Total</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teacher, subject, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 font-medium text-gray-700 w-full sm:w-auto"
            >
              <option value="all">All Request Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Declined</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        {filteredLeaves.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>No leave requests found matching current filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeaves.map((leave) => (
              <div
                key={leave.id}
                className={`p-4 rounded-2xl border transition space-y-3 ${
                  leave.status === 'pending'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                      {leave.teacherName[0]}{leave.teacherSurname[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {leave.teacherName} {leave.teacherSurname}
                      </h4>
                      <p className="text-[11px] text-gray-500">{leave.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getLeaveTypeBadge(leave.leaveType)}
                    <span className="text-xs font-bold text-gray-900">
                      {leave.startDate} to {leave.endDate}
                    </span>
                    <span className="text-[11px] text-gray-500 font-semibold">
                      ({leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'})
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-100">
                  <strong className="text-gray-900">Reason: </strong> {leave.reason}
                </p>

                {leave.handoverDetails && (
                  <p className="text-xs text-gray-600 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                    <strong className="text-emerald-900">Coverage Plan: </strong> {leave.handoverDetails}
                  </p>
                )}

                {leave.adminNotes && (
                  <div className="text-xs p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>
                      <strong>Admin Note ({leave.reviewedBy}): </strong> {leave.adminNotes}
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">
                    Submitted: {new Date(leave.submittedAt).toLocaleString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {leave.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleOpenActionModal(leave, 'approve')}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleOpenActionModal(leave, 'reject')}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          leave.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {leave.status === 'approved' ? '✓ Approved' : '✕ Declined'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="font-bold text-gray-900 text-sm">
                  {actionType === 'approve' ? 'Approve Leave Request' : 'Decline Leave Request'}
                </h3>
                <button onClick={() => setSelectedLeave(null)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-900">
                    {selectedLeave.teacherName} {selectedLeave.teacherSurname}
                  </p>
                  <p className="text-gray-500">
                    {selectedLeave.startDate} to {selectedLeave.endDate} ({selectedLeave.totalDays} days)
                  </p>
                  <p className="text-gray-700 mt-1 italic">"{selectedLeave.reason}"</p>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Administrator Comments / Feedback</label>
                  <textarea
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs resize-none"
                    placeholder="Add optional notes for the teacher..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLeave(null)}
                    className="px-4 py-2 text-gray-600 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    className={`px-5 py-2 text-white font-bold rounded-xl shadow-xs inline-flex items-center gap-1 ${
                      actionType === 'approve'
                        ? 'bg-emerald-700 hover:bg-emerald-800'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Decline'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
