import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Plus,
  Mail,
  BookOpen,
  Phone,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

export const AdminTeachers: React.FC = () => {
  const { users, attendanceRecords, addTeacherByAdmin, deleteTeacher } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);

  // New teacher form state
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [subject, setSubject] = useState('');
  const [email, setEmail] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const registeredTeachers = users.filter((u) => u.role === 'teacher');

  const filteredTeachers = registeredTeachers.filter((t) => {
    const full = `${t.name} ${t.surname} ${t.subject || ''} ${t.email}`.toLowerCase();
    return full.includes(searchQuery.toLowerCase());
  });

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !surname.trim()) return;

    addTeacherByAdmin({
      name: name.trim(),
      surname: surname.trim(),
      subject: subject.trim() || 'General Studies',
      email: email.trim() || `${name.toLowerCase()}.${surname.toLowerCase()}@dadayahigh.ac.zw`,
    });

    setName('');
    setSurname('');
    setSubject('');
    setEmail('');
    setShowAddModal(false);
  };

  const getTeacherStatus = (teacherId: string) => {
    const todayRec = attendanceRecords.find(
      (r) => r.userId === teacherId && r.date === todayStr
    );
    if (!todayRec) return { label: 'Absent', color: 'bg-rose-100 text-rose-800' };
    if (todayRec.status === 'late') return { label: 'Late', color: 'bg-amber-100 text-amber-800' };
    if (todayRec.status === 'early_departure') return { label: 'Early Left', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Present', color: 'bg-emerald-100 text-emerald-800' };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header matching Wireframe screen #5 (All Teachers) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Faculty & Teachers Directory</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage and view all registered teaching staff at Dadaya High School
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Teacher</span>
          </button>
        </div>

        {/* Search Input matching Wireframe */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teacher by name, surname, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700/30"
          />
        </div>
      </div>

      {/* Teachers Directory List */}
      <div className="space-y-3">
        {filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No teachers found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              Teachers will appear here once they register on the sign-up page, or you can add teachers directly.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-800 text-white text-xs font-bold rounded-xl"
            >
              Add First Teacher
            </button>
          </div>
        ) : (
          filteredTeachers.map((teacher) => {
            const status = getTeacherStatus(teacher.id);

            return (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm">
                    {teacher.name?.[0]}
                    {teacher.surname?.[0]}
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      {teacher.name} {teacher.surname}
                    </h3>
                    <p className="text-xs text-blue-900 font-semibold">{teacher.subject || 'General'}</p>
                    <p className="text-[11px] text-gray-400">{teacher.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.color}`}>
                    {status.label}
                  </span>

                  <button
                    onClick={() => deleteTeacher(teacher.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                    title="Remove Teacher"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Teacher Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-base">Add New Teacher</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTeacher} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">First Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tendai"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Surname</label>
                  <input
                    type="text"
                    placeholder="e.g. Ndlovu"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Teaching Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. t.ndlovu@dadayahigh.ac.zw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-xl shadow-xs"
                  >
                    Add Teacher
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
