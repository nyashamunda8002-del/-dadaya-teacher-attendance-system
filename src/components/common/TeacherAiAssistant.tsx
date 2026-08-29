import React, { useState, useRef, useEffect, useMemo } from 'react';
import Markdown from 'react-markdown';
import {
  Bot,
  Sparkles,
  Send,
  X,
  ArrowRight,
  Clock,
  Calendar,
  FileText,
  MapPin,
  RotateCcw,
  Loader2,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  Mic,
  MicOff,
  Copy,
  Check,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from './SchoolCrest';
import { triggerHaptic } from '../../utils/haptics';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  targetView?: string;
  actionTitle?: string;
  prefillData?: {
    leaveType?: string;
    reason?: string;
    noticeType?: string;
  };
  suggestedQuestions?: string[];
  timestamp: string;
}

interface AttendanceAuditData {
  healthGrade: string;
  punctualityScore: number;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  mopseComplianceStatus: string;
}

export const TeacherAiAssistant: React.FC = () => {
  const {
    currentUser,
    activeView,
    setActiveView,
    todayRecord,
    attendanceRecords,
    leaveRequests,
    schoolSettings,
    isSchoolDay,
    currentDayName,
  } = useApp();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'audit' | 'drafter'>('chat');
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Leave Drafter State
  const [draftLeaveType, setDraftLeaveType] = useState<string>('sick');
  const [draftDates, setDraftDates] = useState<string>('');
  const [draftNotes, setDraftNotes] = useState<string>('');
  const [draftResult, setDraftResult] = useState<{
    draftReason?: string;
    formalLetterBody?: string;
    handoverSuggestion?: string;
  } | null>(null);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);

  // Attendance Audit State
  const [auditData, setAuditData] = useState<AttendanceAuditData | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const teacherName = currentUser ? `${currentUser.name} ${currentUser.surname}` : 'Teacher';

  // Compute teacher statistics for AI context
  const myRecords = useMemo(() => {
    return attendanceRecords.filter((r) => r.userId === currentUser?.id);
  }, [attendanceRecords, currentUser]);

  const attendanceStats = useMemo(() => {
    const total = myRecords.length;
    const onTime = myRecords.filter((r) => r.status === 'present').length;
    const lates = myRecords.filter((r) => r.status === 'late').length;
    const punctuality = total > 0 ? Math.round((onTime / total) * 100) : 100;
    return {
      totalDaysLogged: total,
      onTimeCount: onTime,
      lateCount: lates,
      punctualityRate: punctuality,
    };
  }, [myRecords]);

  const defaultSuggestions = useMemo(() => {
    if (!todayRecord?.clockInTime) {
      return [
        'How do I clock in for today?',
        'What time is considered late?',
        'How is my punctuality rating?',
        'What are the official school term dates?',
      ];
    }
    return [
      'What time can I clock out without an early notice?',
      'How is my attendance this term?',
      'Help me draft a sick leave application',
      'Explain the 100m GPS geofence rules',
    ];
  }, [todayRecord]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `Salibonani / Mhoroi, **${currentUser?.name || 'Teacher'}**! I am **Dadaya AI**, your intelligent assistant for school attendance, punctuality analytics, MoPSE regulations, and duty policies.\n\nHow can I help you today?`,
      suggestedQuestions: [
        'How is my punctuality score?',
        'Can I clock out right now?',
        'Help me draft a leave application',
        'What are the 2026 school term dates?',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  // Voice speech-to-text
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-ZW';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        triggerHaptic('light');
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuery(transcript);
          handleSendMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    triggerHaptic('light');
    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Build rich comprehensive context for AI
      const payload = {
        prompt: textToSend,
        userRole: currentUser?.role || 'teacher',
        currentView: activeView,
        userName: teacherName,
        teacherProfile: {
          name: currentUser?.name,
          surname: currentUser?.surname,
          email: currentUser?.email,
          ecNumber: currentUser?.ecNumber || currentUser?.employeeId,
          subject: currentUser?.subject,
          department: currentUser?.department,
          role: currentUser?.role,
        },
        todayAttendance: {
          clockedIn: !!todayRecord?.clockInTime,
          clockInTime: todayRecord?.clockInTime || null,
          clockedOut: !!todayRecord?.clockOutTime,
          clockOutTime: todayRecord?.clockOutTime || null,
          status: todayRecord?.status || 'none',
          durationMinutes: todayRecord?.totalWorkingMinutes || 0,
          distanceMeters: null,
          isWithinCampus: true,
        },
        attendanceSummary: attendanceStats,
        recentRecords: myRecords.slice(0, 8),
        leaveSummary: {
          total: leaveRequests.filter((l) => l.userId === currentUser?.id).length,
          pending: leaveRequests.filter((l) => l.userId === currentUser?.id && l.status === 'pending').length,
          approved: leaveRequests.filter((l) => l.userId === currentUser?.id && l.status === 'approved').length,
        },
        schoolContext: {
          termName: schoolSettings.currentTerm || 'Term 1 2026',
          termStartDate: schoolSettings.termStartDate,
          termEndDate: schoolSettings.termEndDate,
          standardClockInTime: schoolSettings.standardClockInTime,
          standardClockOutTime: schoolSettings.standardClockOutTime,
          lateGracePeriodMinutes: schoolSettings.lateGracePeriodMinutes,
          earlyClockInThreshold: schoolSettings.earlyClockInThreshold,
          earlyClockOutThreshold: schoolSettings.earlyClockOutThreshold,
          allowedRadiusMeters: schoolSettings.allowedRadiusMeters,
          currentDayName,
          isSchoolDay: isSchoolDay(),
        },
      };

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Server returned an error');
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: data.message || 'Here is the guidance based on Dadaya High School attendance policies.',
        targetView: data.targetView || '',
        actionTitle: data.actionTitle || '',
        prefillData: data.prefillData || undefined,
        suggestedQuestions: data.suggestedQuestions || defaultSuggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      triggerHaptic('medium');
    } catch (err) {
      console.warn('AI Assistant error:', err);
      const fallbackMsg: ChatMessage = {
        id: `ai_err_${Date.now()}`,
        sender: 'assistant',
        text: `### 🧭 Quick Navigation Guide
- **Clock In / Out:** Go to the **Home** screen.
- **Attendance Overview:** View your monthly sheet & punctuality in **Attendance**.
- **Leave Application:** Submit leave in **Leave**.
- **Reports:** Download or print official PDF sheets in **Reports**.`,
        suggestedQuestions: defaultSuggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run AI Attendance Audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    triggerHaptic('medium');
    try {
      const res = await fetch('/api/ai/analyze-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: myRecords,
          teacherName,
          role: currentUser?.role || 'teacher',
          schoolSettings,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuditData(data);
      }
    } catch (e) {
      console.warn('Audit fetch failed:', e);
    } finally {
      setIsAuditing(false);
    }
  };

  // Run AI Leave Drafter
  const handleGenerateLeaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDrafting(true);
    triggerHaptic('medium');
    try {
      const res = await fetch('/api/ai/draft-leave-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType: draftLeaveType,
          teacherName,
          subject: currentUser?.subject || 'Academic Department',
          dates: draftDates,
          notes: draftNotes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDraftResult(data);
      }
    } catch (e) {
      console.warn('Draft failed:', e);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleNavigate = (viewKey: string) => {
    triggerHaptic('success');
    setActiveView(viewKey);
    setIsOpen(false);
  };

  const handleResetChat = () => {
    triggerHaptic('light');
    setMessages([
      {
        id: `msg_init_${Date.now()}`,
        sender: 'assistant',
        text: `Chat reset. Welcome back, **${currentUser?.name || 'Teacher'}**! How can I assist you with your attendance or school duties today?`,
        suggestedQuestions: defaultSuggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating AI Assistant Trigger Button (Bottom Right) */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <button
          onClick={() => {
            triggerHaptic('medium');
            setIsOpen((prev) => !prev);
          }}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 hover:from-emerald-700 hover:to-teal-800 text-white rounded-full shadow-2xl border-2 border-emerald-400/50 transition-all transform active:scale-95 cursor-pointer"
          aria-label="Dadaya AI Navigation Assistant"
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-emerald-950 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-emerald-950" />
          </div>

          <div className="text-left hidden xs:block sm:block">
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300 leading-tight flex items-center gap-1">
              <span>Dadaya AI</span>
              <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1 rounded">v3.7</span>
            </div>
            <div className="text-[10px] text-white/90 font-medium leading-none">Smart Assistant</div>
          </div>
        </button>
      </div>

      {/* Slide-Up / Floating Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 text-white w-full sm:max-w-lg h-[90vh] sm:h-[660px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-emerald-700/50 animate-in slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 border-b border-emerald-800/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <SchoolCrest size="sm" />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-emerald-950 flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-white" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm text-white tracking-wide">Dadaya Intelligent AI</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Gemini 3.7
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/75">
                    MoPSE Compliance & Intelligent Policy Assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeTab === 'chat' && (
                  <button
                    onClick={handleResetChat}
                    className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                    title="Reset conversation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setIsOpen(false);
                  }}
                  className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                  title="Close Assistant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Smart Navigation Mode Tabs */}
            <div className="bg-slate-950/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between gap-1 shrink-0 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTab('chat');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'chat'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>AI Chat</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTab('audit');
                    if (!auditData && !isAuditing) {
                      handleRunAudit();
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'audit'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                  <span>Attendance Audit</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTab('drafter');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'drafter'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5 text-teal-300" />
                  <span>Leave Drafter</span>
                </button>
              </div>

              {/* Punctuality Indicator Badge */}
              <div className="hidden sm:flex items-center gap-1 bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 rounded text-[11px] font-bold">
                <Award className="w-3 h-3 text-amber-400" />
                <span>{attendanceStats.punctualityRate}% Punctual</span>
              </div>
            </div>

            {/* TAB 1: AI CHAT */}
            {activeTab === 'chat' && (
              <>
                {/* Quick Query Chips */}
                <div className="bg-slate-950/60 px-3 py-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
                  <button
                    onClick={() => handleSendMessage('How is my punctuality rating?')}
                    className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/40 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition shrink-0 cursor-pointer"
                  >
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>My Punctuality</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage('Can I clock out right now?')}
                    className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/40 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition shrink-0 cursor-pointer"
                  >
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>Clock Out Time</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage('What are the official school term dates?')}
                    className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/40 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition shrink-0 cursor-pointer"
                  >
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    <span>Term Dates</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage('How does the 100m GPS geofence work?')}
                    className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/40 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition shrink-0 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>100m Geofence</span>
                  </button>
                </div>

                {/* Chat Message Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90 text-sm">
                  {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div className="flex items-end gap-2 max-w-[92%]">
                          {!isUser && (
                            <div className="w-6 h-6 rounded-full bg-emerald-800 flex items-center justify-center text-[11px] font-bold shrink-0 border border-emerald-500/40 shadow-xs">
                              <Bot className="w-3.5 h-3.5 text-emerald-300" />
                            </div>
                          )}

                          <div
                            className={`p-3.5 rounded-2xl ${
                              isUser
                                ? 'bg-emerald-700 text-white rounded-br-none shadow-md'
                                : 'bg-slate-800/95 text-slate-100 border border-slate-700/80 rounded-bl-none shadow-md'
                            }`}
                          >
                            <div className="prose prose-invert max-w-none text-xs sm:text-[13px] leading-relaxed break-words">
                              <Markdown>{msg.text}</Markdown>
                            </div>

                            {/* Deep Action Button */}
                            {msg.targetView && (
                              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center gap-2">
                                <button
                                  onClick={() => handleNavigate(msg.targetView!)}
                                  className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                                >
                                  <span>{msg.actionTitle || `Go to ${msg.targetView}`}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-500 px-2">{msg.timestamp}</span>

                        {/* Follow-Up Quick Suggestions */}
                        {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                          <div className="mt-1.5 space-y-1.5 pl-8 max-w-[92%]">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>Smart Suggestions:</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.suggestedQuestions.map((q, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSendMessage(q)}
                                  className="text-left text-[11px] bg-slate-800/90 hover:bg-emerald-950 text-emerald-200 hover:text-emerald-100 border border-emerald-900/60 hover:border-emerald-600/70 px-2.5 py-1 rounded-lg transition active:scale-98"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isLoading && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs pl-8">
                      <div className="w-6 h-6 rounded-full bg-emerald-900/60 flex items-center justify-center shrink-0 border border-emerald-700/40">
                        <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                      </div>
                      <span className="italic text-emerald-300/80">Dadaya AI is reasoning...</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0 safe-bottom"
                >
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-center cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                    title={isListening ? 'Listening...' : 'Voice query'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask about clock-in, leave, punctuality, term dates..."
                    disabled={isLoading}
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition"
                  />

                  <button
                    type="submit"
                    disabled={isLoading || !inputQuery.trim()}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {/* TAB 2: AI ATTENDANCE AUDIT */}
            {activeTab === 'audit' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Attendance & Punctuality Audit</h3>
                    <p className="text-xs text-slate-400">Automated MoPSE Public Service evaluation</p>
                  </div>
                  <button
                    onClick={handleRunAudit}
                    disabled={isAuditing}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isAuditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{isAuditing ? 'Auditing...' : 'Refresh Audit'}</span>
                  </button>
                </div>

                {auditData ? (
                  <div className="space-y-3">
                    {/* Score Card */}
                    <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 rounded-2xl border border-emerald-700/60 shadow-lg flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                          Overall Health Grade
                        </span>
                        <div className="text-3xl font-black text-white">{auditData.healthGrade}</div>
                        <p className="text-xs text-emerald-200/80 mt-1">{auditData.mopseComplianceStatus}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-amber-300">{auditData.punctualityScore}%</div>
                        <span className="text-[10px] text-slate-400">Punctuality Score</span>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                      <h4 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Executive Summary</span>
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{auditData.summary}</p>
                    </div>

                    {/* Strengths */}
                    <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                      <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Key Strengths & Commendations</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {auditData.strengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Improvements */}
                    <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                      <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Recommendations for Improvement</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {auditData.areasForImprovement.map((imp, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleNavigate('reports')}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <span>View & Download Official PDF Report</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <p className="text-xs">Analyzing teacher records with Gemini 3.7...</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AI LEAVE DRAFTER */}
            {activeTab === 'drafter' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90 text-sm">
                <div>
                  <h3 className="font-extrabold text-sm text-white">Smart MoPSE Leave Drafter</h3>
                  <p className="text-xs text-slate-400">
                    Generates official, compliant leave justifications for school administration.
                  </p>
                </div>

                <form onSubmit={handleGenerateLeaveDraft} className="space-y-3 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Leave Category</label>
                    <select
                      value={draftLeaveType}
                      onChange={(e) => setDraftLeaveType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="sick">Medical / Sick Leave</option>
                      <option value="annual">Annual / Casual Leave</option>
                      <option value="compassionate">Compassionate / Bereavement</option>
                      <option value="official_duty">Official Duty / ZIMSEC / Workshop</option>
                      <option value="study">Study / Examination Leave</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Requested Dates</label>
                    <input
                      type="text"
                      placeholder="e.g. 2nd March 2026 to 4th March 2026"
                      value={draftDates}
                      onChange={(e) => setDraftDates(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Specific Circumstances / Notes</label>
                    <textarea
                      placeholder="e.g. Scheduled specialist doctor appointment in Bulawayo; lesson plans prepared for Form 3 Geography."
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isDrafting}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {isDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isDrafting ? 'Drafting with Gemini...' : 'Generate MoPSE Motivation'}</span>
                  </button>
                </form>

                {draftResult && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="bg-slate-800 p-3.5 rounded-2xl border border-emerald-700/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                          Recommended Form Reason
                        </span>
                        <button
                          onClick={() => handleCopyText(draftResult.draftReason || '', 'reason')}
                          className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1"
                        >
                          {copiedId === 'reason' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === 'reason' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{draftResult.draftReason}</p>
                    </div>

                    <div className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                          Formal Letter Body
                        </span>
                        <button
                          onClick={() => handleCopyText(draftResult.formalLetterBody || '', 'letter')}
                          className="text-[11px] text-teal-300 hover:text-white flex items-center gap-1"
                        >
                          {copiedId === 'letter' ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === 'letter' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {draftResult.formalLetterBody}
                      </pre>
                    </div>

                    <button
                      onClick={() => handleNavigate('leave')}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <span>Open Leave Form to Submit</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
