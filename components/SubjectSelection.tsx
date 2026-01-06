import React, { useState, useEffect } from 'react';
import { Subject, ExamResult, ExamType, SubjectInfo } from '../types';
import { 
  CheckCircle, PlayCircle, LogOut, History, Calendar, Key, X, Eye, Moon, Sun, Layers, MousePointer2, MessageSquare 
} from 'lucide-react';
import Button from './Button';
import { User, changePassword } from '../services/auth';
import { getStudentResults, getAllSubjects } from '../services/db';
import { ContactModal } from './ContactModal';
import { AcenexaLogo } from './ExamLogos';

interface Props {
  onStartExam: (subjects: Subject[]) => void;
  hasSavedSession: boolean;
  onResume: () => void;
  onLogout: () => void;
  onReview: (result: ExamResult) => void;
  user: User;
  examType: ExamType;
  setExamType: (type: ExamType) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const SubjectSelection: React.FC<Props> = ({ 
  onStartExam, hasSavedSession, onResume, onLogout, onReview, 
  user, examType, setExamType, theme, toggleTheme 
}) => {
  const [selected, setSelected] = useState<Subject[]>([]);
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [pwdData, setPwdData] = useState({ old: '', new: '', confirm: '' });

  const [allSubjects, setAllSubjects] = useState<SubjectInfo[]>([]);
  const [jambSubjects, setJambSubjects] = useState<Subject[]>([]);
  const [waecSubjects, setWaecSubjects] = useState<Record<string, Subject[]>>({});

  useEffect(() => {
    if (user.username) {
      getStudentResults(user.username)
        .then(res => setHistory(res))
        .catch(console.error);

      getAllSubjects()
        .then(subjects => {
          setAllSubjects(subjects);
          const jamb = subjects.filter(s => !s.is_compulsory).map(s => s.name);
          setJambSubjects(jamb);

          const waecGroups: Record<string, Subject[]> = {};
          subjects.forEach(s => {
            const categoryKey = s.category === 'General' ? 'General (Core)' : s.category;
            if (!waecGroups[categoryKey]) waecGroups[categoryKey] = [];
            waecGroups[categoryKey].push(s.name);
          });
          setWaecSubjects(waecGroups);
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    setSelected([]);
  }, [examType]);

  const JAMB_ELECTIVES_COUNT = 3;
  const WAEC_SUBJECT_COUNT = 1;
  const targetCount = examType === 'JAMB' ? JAMB_ELECTIVES_COUNT : WAEC_SUBJECT_COUNT;
  const isJamb = examType === 'JAMB';

  const toggleSubject = (sub: Subject) => {
    if (!isJamb) {
      setSelected(selected.includes(sub) ? [] : [sub]);
      return;
    }
    if (selected.includes(sub)) setSelected(selected.filter(s => s !== sub));
    else if (selected.length < targetCount) setSelected([...selected, sub]);
  };

  const isValid = selected.length === targetCount;

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdData.new !== pwdData.confirm) return alert("New passwords do not match");

    try {
      await changePassword(user.username, pwdData.old, pwdData.new, 'student');
      alert("Password changed successfully!");
      setPwdData({ old: '', new: '', confirm: '' });
      setShowPwdModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to change password");
    }
  };

  const renderSubjectButton = (sub: Subject) => (
    <button
      key={sub}
      onClick={() => toggleSubject(sub)}
      className={`
        p-3 md:p-4 rounded-lg border text-left text-xs md:text-sm transition-all relative font-medium active:scale-[0.98] flex items-center justify-between shadow-sm
        ${selected.includes(sub) 
          ? isJamb 
            ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-100 ring-1 ring-green-500' 
            : 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
        }
      `}
    >
      <span className="truncate mr-2 font-semibold flex items-center gap-2">{sub}</span>
      {selected.includes(sub) && <CheckCircle size={16} className={isJamb ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"} />}
    </button>
  );

  return (
    <div className="min-h-[100dvh] bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-start md:justify-center p-0 md:p-4 transition-colors duration-300">
      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} initialName={user.fullName} />

      <div className={`bg-white dark:bg-gray-800 w-full md:max-w-5xl md:rounded-xl shadow-2xl overflow-hidden mb-0 md:mb-8 relative border-t-8 transition-colors duration-500 flex flex-col h-full md:h-auto ${isJamb ? 'border-green-600' : 'border-blue-600'}`}>
        {/* HEADER */}
        <div className={`p-4 md:p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors duration-500 shrink-0 ${isJamb ? 'bg-green-900' : 'bg-blue-900'}`}>
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className={`bg-white p-1.5 md:p-2 rounded-full border-2 ${isJamb ? 'border-yellow-500' : 'border-white'}`}>
                <AcenexaLogo className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">ACENEXA</h1>
                <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-yellow-400">{examType} CBT Portal</p>
              </div>
            </div>
            <button onClick={onLogout} className="md:hidden text-xs bg-red-600 px-3 py-2 rounded hover:bg-red-700 transition flex items-center gap-1 font-bold shadow-md">
              <LogOut size={14}/>
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-0 border-white/20 pt-3 md:pt-0">
            <div className="text-left md:text-right">
              <p className="font-bold text-sm truncate max-w-[150px] md:max-w-none">{user.fullName || user.username}</p>
              <p className="text-green-100/80 text-xs font-mono">{user.regNumber}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleTheme} className="text-xs bg-black/20 px-3 py-2 rounded hover:bg-black/30 transition flex items-center gap-1 border border-white/10" title="Toggle Theme">
                {theme === 'light' ? <Moon size={14}/> : <Sun size={14} className="text-yellow-400"/>}
              </button>
              <button onClick={() => setShowContact(true)} className="text-xs bg-black/20 px-3 py-2 rounded hover:bg-black/30 transition flex items-center gap-1 border border-white/10" title="Contact Support">
                <MessageSquare size={14}/>
              </button>
              <button onClick={() => setShowPwdModal(true)} className="text-xs bg-black/20 px-3 py-2 rounded hover:bg-black/30 transition flex items-center gap-1 border border-white/10" title="Change Password">
                <Key size={14}/>
              </button>
              <button onClick={onLogout} className="hidden md:flex text-xs bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition items-center gap-1 font-bold shadow-md">
                <LogOut size={14}/>
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPwdModal && (
          <div className="fixed inset-0 bg-green-900/80 dark:bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-sm shadow-2xl border-t-4 border-yellow-500">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Change Password</h3>
                <button onClick={() => setShowPwdModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"><X size={20}/></button>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Old Password</label>
                  <input type="password" value={pwdData.old} onChange={e => setPwdData({...pwdData, old: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">New Password</label>
                  <input type="password" value={pwdData.new} onChange={e => setPwdData({...pwdData, new: e.target.value})} minLength={6} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Confirm New</label>
                  <input type="password" value={pwdData.confirm} onChange={e => setPwdData({...pwdData, confirm: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required/>
                </div>
                <Button className="w-full bg-green-700 hover:bg-green-800 text-white">Save Changes</Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
