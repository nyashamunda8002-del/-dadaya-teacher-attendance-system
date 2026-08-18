import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  ArrowRight,
  HelpCircle,
  Clock,
  Calendar,
  FileText,
  MapPin,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  Loader2,
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
  suggestedQuestions?: string[];
  timestamp: string;
}

const DEFAULT_SUGGESTIONS = [
  'How do I clock in for duty?',
  'How to submit a leave request?',
  'What if I arrive before 07:15 AM?',
  'Where is my attendance history?',
  'Why do I need to enable GPS?',
];

export const TeacherAiAssistant: React.FC = () => {
  const { currentUser, activeView, setActiveView } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const teacherName = currentUser?.name || 'Teacher';
    return [
      {
        id: 'msg_welcome',
        sender: 'assistant',
        text: `Salibonani / Mhoroi, ${teacherName}! I am your Dadaya High School AI Assistant. How can I help you navigate the attendance system or understand school duty policies today?`,
        suggestedQuestions: DEFAULT_SUGGESTIONS,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          userRole: currentUser?.role || 'teacher',
          currentView: activeView,
          userName: currentUser ? `${currentUser.name} ${currentUser.surname}` : 'Teacher',
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned an error');
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: data.message || 'Here is what I found in the Dadaya High School attendance manual.',
        targetView: data.targetView || '',
        actionTitle: data.actionTitle || '',
        suggestedQuestions: data.suggestedQuestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      triggerHaptic('medium');
    } catch (err) {
      console.warn('AI Assistant error:', err);
      // Friendly local fallback
      const fallbackMsg: ChatMessage = {
        id: `ai_err_${Date.now()}`,
        sender: 'assistant',
        text: `To navigate:
• For Clock In / Out: Select "Home" in the navigation bar.
• For Leave: Select "Leave" to submit sick or vacation requests.
• For History: Select "History" to view past shift logs.
• For ID & Profile: Select "Profile".`,
        suggestedQuestions: DEFAULT_SUGGESTIONS,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (viewKey: string) => {
    triggerHaptic('success');
    setActiveView(viewKey);
    setIsOpen(false);
  };

  const handleResetChat = () => {
    triggerHaptic('light');
    const teacherName = currentUser?.name || 'Teacher';
    setMessages([
      {
        id: `msg_init_${Date.now()}`,
        sender: 'assistant',
        text: `Chat reset. Welcome back, ${teacherName}! What question do you have about using the Dadaya High School Attendance App?`,
        suggestedQuestions: DEFAULT_SUGGESTIONS,
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
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-800 text-white rounded-full shadow-xl hover:shadow-2xl border-2 border-emerald-400/40 transition-all transform active:scale-95 cursor-pointer"
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
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300 leading-tight">
              AI Assistant
            </div>
            <div className="text-[10px] text-white/90 font-medium leading-none">Need Help?</div>
          </div>
        </button>
      </div>

      {/* Slide-Up / Floating Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 text-white w-full sm:max-w-md h-[85vh] sm:h-[620px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-emerald-800/60 animate-in slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border-b border-emerald-800/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <SchoolCrest size="sm" />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-emerald-950 flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-white" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm text-white tracking-wide">Dadaya AI Guide</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Gemini 3.7
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/70">
                    App Navigation & School Attendance Policy
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  className="p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setIsOpen(false);
                  }}
                  className="p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                  title="Close Assistant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Navigation Action Chips */}
            <div className="bg-slate-950/70 px-3 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
              <button
                onClick={() => handleSendMessage('How do I clock in?')}
                className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/40 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition shrink-0 cursor-pointer"
              >
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Clock In</span>
              </button>
              <button
                onClick={() => handleSendMessage('How do I apply for leave?')}
                className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/40 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition shrink-0 cursor-pointer"
              >
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>Leave Form</span>
              </button>
              <button
                onClick={() => handleSendMessage('How do geofence and GPS location work?')}
                className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/40 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition shrink-0 cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>GPS Geofence</span>
              </button>
              <button
                onClick={() => handleSendMessage('Where can I see my attendance records?')}
                className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/40 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition shrink-0 cursor-pointer"
              >
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>History</span>
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90 text-sm">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-end gap-2 max-w-[88%]">
                      {!isUser && (
                        <div className="w-6 h-6 rounded-full bg-emerald-800 flex items-center justify-center text-[11px] font-bold shrink-0 border border-emerald-500/40">
                          <Bot className="w-3.5 h-3.5 text-emerald-300" />
                        </div>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl ${
                          isUser
                            ? 'bg-emerald-700 text-white rounded-br-none shadow-md'
                            : 'bg-slate-800/90 text-slate-100 border border-slate-700/70 rounded-bl-none shadow-md'
                        }`}
                      >
                        <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>

                        {/* Interactive Deep-Link Navigation Action */}
                        {msg.targetView && (
                          <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                            <button
                              onClick={() => handleNavigate(msg.targetView!)}
                              className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                            >
                              <span>{msg.actionTitle || `Navigate to ${msg.targetView}`}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-500 px-2">{msg.timestamp}</span>

                    {/* Follow-up question suggestion chips */}
                    {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="mt-2 space-y-1.5 pl-8 max-w-[90%]">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Suggested Questions:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedQuestions.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(q)}
                              className="text-left text-[11px] bg-slate-800 hover:bg-emerald-950 text-emerald-200 hover:text-emerald-100 border border-emerald-900/60 hover:border-emerald-700/80 px-2.5 py-1 rounded-lg transition"
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
                  <span className="italic text-emerald-300/80">Dadaya AI is thinking...</span>
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
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about clock-in, leave, history..."
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
          </div>
        </div>
      )}
    </>
  );
};
