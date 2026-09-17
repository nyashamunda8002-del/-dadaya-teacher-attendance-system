import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  Layers,
  AlertCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolClass, User } from '../../types';

export const AdminClassAllocation: React.FC = () => {
  const {
    users,
    classes,
    allocateClassesToTeacher,
    saveSchoolClass,
    deleteSchoolClass,
    resetToOfficialClasses,
  } = useApp();

  const teachers = users.filter((u) => u.role === 'teacher');

  const [searchTeacher, setSearchTeacher] = useState<string>('');
  const [activeTeacherForAllocation, setActiveTeacherForAllocation] = useState<User | null>(null);
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isResettingClasses, setIsResettingClasses] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'allocations' | 'classes'>('allocations');

  // New Class Modal State
  const [isAddingClass, setIsAddingClass] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>('');
  const [newFormLevel, setNewFormLevel] = useState<string>('Form 1');
  const [newCapacity, setNewCapacity] = useState<number>(45);
  const [newRoom, setNewRoom] = useState<string>('');

  const filteredTeachers = teachers.filter((t) => {
    const full = `${t.name} ${t.surname} ${t.subject || ''} ${t.ecNumber || ''}`.toLowerCase();
    return full.includes(searchTeacher.toLowerCase());
  });

  // Open Allocation Modal for a Teacher
  const handleOpenAllocation = (teacher: User) => {
    setActiveTeacherForAllocation(teacher);
    setSelectedClassNames(teacher.assignedClasses || []);
  };

  const handleToggleClass = (className: string) => {
    setSelectedClassNames((prev) =>
      prev.includes(className) ? prev.filter((c) => c !== className) : [...prev, className]
    );
  };

  const handleSaveAllocation = async () => {
    if (!activeTeacherForAllocation) return;
    const res = await allocateClassesToTeacher(
      activeTeacherForAllocation.id,
      selectedClassNames
    );
    if (res.success) {
      setSuccessToast(res.message);
      setTimeout(() => setSuccessToast(null), 3500);
      setActiveTeacherForAllocation(null);
    }
  };

  const handleCreateNewClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const classId = `cls_${Date.now()}`;
    const newCls: SchoolClass = {
      id: classId,
      name: newClassName.trim(),
      formLevel: newFormLevel,
      capacity: newCapacity || 45,
      roomNumber: newRoom.trim() || undefined,
    };

    await saveSchoolClass(newCls);
    setNewClassName('');
    setNewRoom('');
    setIsAddingClass(false);
    setSuccessToast(`Class "${newCls.name}" added successfully.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleSyncOfficialClasses = async () => {
    if (
      !window.confirm(
        'Restore all classes to the official Dadaya High School structure (Form 1 Red/Green/Yellow/Blue, Form 2 Red/Green/White/Yellow/Blue, Form 3 & 4 Sciences 1/2, Commercials, Arts/ICT, and A-Level)?'
      )
    ) {
      return;
    }
    setIsResettingClasses(true);
    const res = await resetToOfficialClasses();
    setIsResettingClasses(false);
    setSuccessToast(res.message);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-md animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-emerald-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
              <Layers className="w-8 h-8 text-emerald-300" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-300">
                Administration Portal • Academic Scheduling
              </span>
              <h2 className="text-2xl font-bold">Class Allocation & Management</h2>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Assign and manage class teacher responsibilities across Dadaya High School forms and departments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncOfficialClasses}
              disabled={isResettingClasses}
              title="Reset all classes to official Dadaya structure"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-xl text-xs font-bold transition-all border border-emerald-600/50 shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResettingClasses ? 'animate-spin' : ''}`} />
              <span>Sync Dadaya Classes</span>
            </button>

            <button
              onClick={() => setIsAddingClass(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Add New Class</span>
            </button>
          </div>
        </div>

        {/* Quick metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-emerald-700/40">
          <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-700/30">
            <span className="text-[11px] text-emerald-300 font-medium">Total Registered Classes</span>
            <div className="text-xl font-black text-white mt-0.5">{classes.length} Classes</div>
          </div>

          <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-700/30">
            <span className="text-[11px] text-emerald-300 font-medium">Teaching Faculty</span>
            <div className="text-xl font-black text-white mt-0.5">{teachers.length} Teachers</div>
          </div>

          <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-700/30">
            <span className="text-[11px] text-emerald-300 font-medium">Allocated Classes</span>
            <div className="text-xl font-black text-emerald-300 mt-0.5">
              {classes.filter((c) => c.assignedTeacherName).length} / {classes.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'allocations'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faculty Allocations</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'allocations' ? 'bg-emerald-950/50 text-emerald-200' : 'bg-slate-200 text-slate-700'}`}>
            {teachers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'classes'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Dadaya Classes Directory</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'classes' ? 'bg-emerald-950/50 text-emerald-200' : 'bg-slate-200 text-slate-700'}`}>
            {classes.length}
          </span>
        </button>
      </div>

      {/* View: Faculty Allocations */}
      {activeTab === 'allocations' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Faculty Class Allocations</h3>
              <p className="text-xs text-slate-500">
                Select any educator below to allocate or re-allocate classes.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search teacher by name, EC number or subject..."
                value={searchTeacher}
                onChange={(e) => setSearchTeacher(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[260px]"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No teachers found</p>
              </div>
            ) : (
              filteredTeachers.map((teacher) => {
                const assigned = teacher.assignedClasses || [];
                return (
                  <div
                    key={teacher.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-sm border border-emerald-200">
                        {teacher.name[0]}
                        {teacher.surname[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {teacher.name} {teacher.surname}
                          </h4>
                          {teacher.ecNumber && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              EC: {teacher.ecNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Subject: <span className="font-medium text-slate-700">{teacher.subject || 'General'}</span> • {teacher.email}
                        </p>

                        {/* Assigned Classes Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {assigned.length === 0 ? (
                            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                              No classes allocated yet
                            </span>
                          ) : (
                            assigned.map((cls) => (
                              <span
                                key={cls}
                                className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-md border border-emerald-300"
                              >
                                {cls}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenAllocation(teacher)}
                      className="self-start md:self-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Allocate Classes</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* View: Dadaya Classes Directory */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Lower 6', 'Upper 6'].map((level) => {
            const formClasses = classes.filter((c) => c.formLevel === level);
            if (formClasses.length === 0) return null;

            return (
              <div key={level} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <h3 className="font-bold text-slate-900 text-sm">{level} Streams</h3>
                    <span className="text-xs text-slate-500 font-medium">({formClasses.length} classes)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Official Dadaya Structure</span>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {formClasses.map((cls) => {
                    const assignedTeachers = teachers.filter((t) =>
                      t.assignedClasses?.includes(cls.name)
                    );

                    return (
                      <div
                        key={cls.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors bg-white flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{cls.name}</h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {cls.formLevel}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                            {cls.roomNumber && <p>📍 {cls.roomNumber}</p>}
                            <p>👥 Max Capacity: {cls.capacity} students</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-xs">
                            {assignedTeachers.length > 0 ? (
                              <span className="font-semibold text-emerald-800">
                                👨‍🏫 {assignedTeachers.map((t) => `${t.name} ${t.surname}`).join(', ')}
                              </span>
                            ) : (
                              <span className="text-amber-700 italic">Unassigned</span>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Delete class ${cls.name}?`)) {
                                await deleteSchoolClass(cls.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete Class"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Allocation Modal */}
      {activeTeacherForAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="bg-emerald-900 p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-300">
                  Allocate Classes
                </span>
                <h3 className="text-lg font-bold">
                  {activeTeacherForAllocation.name} {activeTeacherForAllocation.surname}
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Check the classes this educator is responsible for registering daily attendance.
                </p>
              </div>

              <button
                onClick={() => setActiveTeacherForAllocation(null)}
                className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-100 pb-2">
                <span>Select Classes ({selectedClassNames.length} selected)</span>
                <button
                  onClick={() => setSelectedClassNames(classes.map((c) => c.name))}
                  className="text-emerald-700 hover:underline"
                >
                  Select All
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {classes.map((c) => {
                  const isChecked = selectedClassNames.includes(c.name);
                  const isOtherAssigned =
                    c.assignedTeacherId &&
                    c.assignedTeacherId !== activeTeacherForAllocation.id;

                  return (
                    <label
                      key={c.id}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                          : 'border-slate-200 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-800 text-xs">{c.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleClass(c.name)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mt-0.5"
                        />
                      </div>

                      <div className="mt-2 text-[10px] text-slate-500 flex flex-col">
                        <span>{c.formLevel} • Max {c.capacity}</span>
                        {isOtherAssigned && (
                          <span className="text-amber-600 font-medium mt-0.5">
                            Currently: {c.assignedTeacherName}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setActiveTeacherForAllocation(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAllocation}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Class Modal */}
      {isAddingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-emerald-900 p-5 text-white">
              <h3 className="font-bold text-base">Add New School Class</h3>
              <p className="text-xs text-emerald-200">
                Create a new official class for Dadaya High School.
              </p>
            </div>

            <form onSubmit={handleCreateNewClass} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Class Name (e.g. Form 2C, Form 4 Commercials)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Form 3 Commercials"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Form Level
                  </label>
                  <select
                    value={newFormLevel}
                    onChange={(e) => setNewFormLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Form 1">Form 1</option>
                    <option value="Form 2">Form 2</option>
                    <option value="Form 3">Form 3</option>
                    <option value="Form 4">Form 4</option>
                    <option value="Lower 6">Lower 6</option>
                    <option value="Upper 6">Upper 6</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Class Capacity
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(parseInt(e.target.value) || 45)}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Room / Building (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block C, Room 4"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingClass(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
                >
                  Add Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
