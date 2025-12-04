import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { 
  ArrowLeft, BrainCircuit, Trophy, CheckCircle, XCircle, 
  Loader2, AlertCircle, Sparkles, Flame, RefreshCcw, LogOut, Shuffle, PenTool, Lightbulb, Check, X, Send, ThumbsUp, AlertTriangle
} from 'lucide-react';
import { generateQuizQuestion, generateEssayQuestion, checkEssayAnswer } from '../services/geminiService';
import { QuizQuestion, EssayQuestion } from '../types';

interface QuizViewProps {
  onBack?: () => void;
}

const TOPICS = [
  { id: 'NAHWU', label: 'Nahwu & Shorof', color: 'blue' },
  { id: 'FIQIH', label: 'Fiqih Ibadah', color: 'emerald' },
  { id: 'TAUHID', label: 'Aqidah Tauhid', color: 'indigo' },
  { id: 'TARIKH', label: 'Sejarah Islam', color: 'amber' },
  { id: 'TAJWID', label: 'Ilmu Tajwid', color: 'teal' },
  { id: 'AKHLAK', label: 'Akhlak & Tasawuf', color: 'rose' }
];

type GameMode = 'MULTIPLE_CHOICE' | 'ESSAY';

const QuizView: React.FC<QuizViewProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'RESULT'>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('MULTIPLE_CHOICE');
  const [selectedTopic, setSelectedTopic] = useState<{id: string, label: string} | null>(null);
  
  // State untuk Pilihan Ganda
  const [currentMCQuestion, setCurrentMCQuestion] = useState<QuizQuestion | null>(null);
  const [selectedMCOption, setSelectedMCOption] = useState<number | null>(null);
  
  // State untuk Esai/Tantangan
  const [currentEssayQuestion, setCurrentEssayQuestion] = useState<EssayQuestion | null>(null);
  const [essayRevealed, setEssayRevealed] = useState(false);
  const [userEssayAnswer, setUserEssayAnswer] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [essayFeedback, setEssayFeedback] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // State untuk Popup Hasil (Feedback)
  const [feedbackModal, setFeedbackModal] = useState<'CORRECT' | 'INCORRECT' | null>(null);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message: string) => setToast({ show: true, message });

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Function accepts explicit streak to avoid closure staleness during startGame
  const loadNewQuestion = async (topic: string, currentStreak: number) => {
    setIsLoading(true);
    setError(null);
    // Reset States
    setSelectedMCOption(null);
    setIsAnswerRevealed(false);
    setEssayRevealed(false);
    setUserEssayAnswer(''); // Reset input esai
    setFeedbackModal(null); // Close modal if open
    setEssayFeedback('');
    setIsChecking(false);
    
    // Determine difficulty based on streak
    let difficulty = "Mudah";
    if (currentStreak > 3) difficulty = "Sedang";
    if (currentStreak > 7) difficulty = "Sulit";
    if (currentStreak > 12) difficulty = "Sangat Sulit (Bahtsul Masail)";

    try {
      if (gameMode === 'MULTIPLE_CHOICE') {
         const question = await generateQuizQuestion(topic, difficulty);
         setCurrentMCQuestion(question);
         setCurrentEssayQuestion(null);
      } else {
         const question = await generateEssayQuestion(topic, difficulty);
         setCurrentEssayQuestion(question);
         setCurrentMCQuestion(null);
      }
    } catch (err) {
      setError("Gagal memuat soal. Koneksi bermasalah.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = (topic: typeof TOPICS[0]) => {
    setSelectedTopic(topic);
    setGameState('PLAYING');
    setScore(0);
    setStreak(0);
    // Explicitly pass 0 as streak for new game
    loadNewQuestion(topic.label, 0);
  };

  const handleRandomGame = () => {
    const randomIndex = Math.floor(Math.random() * TOPICS.length);
    const randomTopic = TOPICS[randomIndex];
    handleStartGame(randomTopic);
  };

  // Logic Pilihan Ganda
  const handleMCAnswer = (index: number) => {
    if (isAnswerRevealed || !currentMCQuestion) return;
    
    setSelectedMCOption(index);
    setIsAnswerRevealed(true);

    if (index === currentMCQuestion.correctIndex) {
      setScore(prev => prev + 10 + (streak * 2)); // Bonus points for streak
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  // Logic Esai: Check Answer with AI
  const handleCheckEssay = async () => {
    if (!userEssayAnswer.trim() || !currentEssayQuestion) return;
    
    setIsChecking(true);
    try {
      const analysis = await checkEssayAnswer(
        currentEssayQuestion.question,
        currentEssayQuestion.answerKey,
        userEssayAnswer
      );

      setEssayFeedback(analysis.feedback);
      
      if (analysis.isCorrect) {
        setScore(prev => prev + 15 + (streak * 3)); // Higher points for essay
        setStreak(prev => prev + 1);
        setFeedbackModal('CORRECT');
      } else {
        setStreak(0);
        setFeedbackModal('INCORRECT');
      }
    } catch (e) {
      showToast("Gagal mengoreksi. Periksa koneksi internet");
    } finally {
      setIsChecking(false);
    }
  };

  const handleNext = () => {
    if (selectedTopic) {
      // For next question, use current streak state
      loadNewQuestion(selectedTopic.label, streak);
    }
  };

  const handleNextFromFeedback = () => {
    setFeedbackModal(null);
    handleNext();
  };

  const handleQuit = () => {
    if (confirm("Yakin ingin keluar? Skor Anda akan direset.")) {
      setGameState('MENU');
      setCurrentMCQuestion(null);
      setCurrentEssayQuestion(null);
      setFeedbackModal(null);
    }
  };

  const getColorClass = (color: string) => {
    const colors: {[key: string]: string} = {
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
      rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    };
    return colors[color] || colors['emerald'];
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-gray-950 pb-32 flex flex-col animate-fade-in">
      <Toast message={toast.message} isVisible={toast.show} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#FDFBF7]/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-4 shadow-sm">
         <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={handleBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                  <h2 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-purple-600" /> Cerdas Cermat
                  </h2>
              </div>
            </div>
            
            {gameState === 'PLAYING' && (
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1 text-amber-500 font-bold text-sm animate-pulse">
                    <Flame className="w-4 h-4 fill-current" />
                    <span>{streak}</span>
                 </div>
                 <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-bold">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{score}</span>
                 </div>
              </div>
            )}
         </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex-grow flex flex-col">
         
         {gameState === 'MENU' && (
            <div className="space-y-6 animate-slide-up">
               <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <Trophy className="w-16 h-16 mx-auto text-purple-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Uji Wawasan Santri</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto mb-6">
                    Pilih mode permainan dan topik di bawah ini.
                  </p>
                  
                  {/* Mode Selection */}
                  <div className="flex justify-center gap-2 mb-6 px-4">
                     <button 
                       onClick={() => setGameMode('MULTIPLE_CHOICE')}
                       className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${gameMode === 'MULTIPLE_CHOICE' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'}`}
                     >
                        Pilihan Ganda
                     </button>
                     <button 
                       onClick={() => setGameMode('ESSAY')}
                       className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 flex items-center gap-2 ${gameMode === 'ESSAY' ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'}`}
                     >
                        <PenTool className="w-4 h-4" />
                        Tantangan Santri
                     </button>
                  </div>

                  <button 
                    onClick={handleRandomGame}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full font-bold shadow-lg transform transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    <Shuffle className="w-5 h-5" />
                    <span>Acak Topik (Random)</span>
                  </button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleStartGame(topic)}
                      className={`p-5 rounded-2xl text-left font-bold text-lg transition-all hover:scale-[1.02] hover:shadow-md ${getColorClass(topic.color)}`}
                    >
                       {topic.label}
                    </button>
                  ))}
               </div>
            </div>
         )}

         {gameState === 'PLAYING' && (
            <div className="flex-1 flex flex-col">
               
               {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                     <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-purple-500 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
                     </div>
                     <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                        AI sedang menyusun soal {gameMode === 'ESSAY' ? 'tantangan' : 'kuis'}...
                     </p>
                  </div>
               ) : error ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                     <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                     <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
                     <button 
                       onClick={() => selectedTopic && loadNewQuestion(selectedTopic.label, streak)}
                       className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 transition-colors"
                     >
                        Coba Lagi
                     </button>
                  </div>
               ) : (
                  <div className="flex flex-col h-full animate-slide-up">
                     
                     {/* --- MODE PILIHAN GANDA --- */}
                     {gameMode === 'MULTIPLE_CHOICE' && currentMCQuestion && (
                        <>
                           <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border-2 border-purple-100 dark:border-gray-700 shadow-lg mb-6 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 dark:bg-purple-900/20 rounded-bl-full -mr-4 -mt-4"></div>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 leading-relaxed relative z-10">
                                 {currentMCQuestion.question}
                              </h3>
                           </div>

                           <div className="space-y-3 flex-1">
                              {currentMCQuestion.options.map((opt, idx) => {
                                 let btnClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700";
                                 
                                 if (isAnswerRevealed) {
                                    if (idx === currentMCQuestion.correctIndex) {
                                       btnClass = "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-200 dark:border-green-600";
                                    } else if (idx === selectedMCOption) {
                                       btnClass = "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-200 dark:border-red-600";
                                    } else {
                                       btnClass = "bg-gray-100 dark:bg-gray-800/50 text-gray-400 border-transparent opacity-60";
                                    }
                                 } else if (selectedMCOption === idx) {
                                    btnClass = "bg-purple-100 border-purple-500 text-purple-800";
                                 }

                                 return (
                                    <button
                                       key={idx}
                                       onClick={() => handleMCAnswer(idx)}
                                       disabled={isAnswerRevealed}
                                       className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all flex items-center justify-between ${btnClass}`}
                                    >
                                       <span>{opt}</span>
                                       {isAnswerRevealed && idx === currentMCQuestion.correctIndex && <CheckCircle className="w-5 h-5 text-green-600" />}
                                       {isAnswerRevealed && idx === selectedMCOption && idx !== currentMCQuestion.correctIndex && <XCircle className="w-5 h-5 text-red-600" />}
                                    </button>
                                 );
                              })}
                           </div>

                           {isAnswerRevealed && (
                              <div className="mt-6 animate-slide-down">
                                 <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
                                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                       <Lightbulb className="w-4 h-4" /> Penjelasan
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                       {currentMCQuestion.explanation}
                                    </p>
                                 </div>
                                 <button 
                                    onClick={handleNext}
                                    className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                 >
                                    Soal Berikutnya <ArrowLeft className="w-5 h-5 rotate-180" />
                                 </button>
                              </div>
                           )}
                        </>
                     )}

                     {/* --- MODE ESAI / TANTANGAN --- */}
                     {gameMode === 'ESSAY' && currentEssayQuestion && (
                        <>
                           <div className="bg-amber-50 dark:bg-amber-900/10 rounded-3xl p-6 border-2 border-amber-200 dark:border-amber-800 shadow-sm mb-6">
                              <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold uppercase tracking-wider mb-3">
                                 {currentEssayQuestion.type.replace('_', ' ')}
                              </span>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 leading-relaxed">
                                 {currentEssayQuestion.question}
                              </h3>
                              {currentEssayQuestion.clue && (
                                 <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-amber-100 dark:border-amber-800/50 flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                       Clue: {currentEssayQuestion.clue}
                                    </p>
                                 </div>
                              )}
                           </div>

                           <div className="flex-1 flex flex-col">
                              <label className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Jawaban Anda</label>
                              <textarea
                                 value={userEssayAnswer}
                                 onChange={(e) => setUserEssayAnswer(e.target.value)}
                                 placeholder="Ketik jawaban Anda di sini..."
                                 disabled={feedbackModal !== null}
                                 className="w-full p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 outline-none text-gray-800 dark:text-gray-100 min-h-[120px] mb-4 resize-none transition-all"
                              />
                              
                              <button 
                                 onClick={handleCheckEssay}
                                 disabled={isChecking || !userEssayAnswer.trim() || feedbackModal !== null}
                                 className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                 {isChecking ? (
                                    <>
                                       <Loader2 className="w-5 h-5 animate-spin" /> Mengoreksi...
                                    </>
                                 ) : (
                                    <>
                                       <CheckCircle className="w-5 h-5" /> Cek Jawaban
                                    </>
                                 )}
                              </button>
                           </div>
                        </>
                     )}

                     {/* Footer Buttons */}
                     {(!isAnswerRevealed && feedbackModal === null) && (
                        <div className="mt-6 flex justify-center">
                           <button 
                              onClick={handleQuit}
                              className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-sm font-medium"
                           >
                              <LogOut className="w-4 h-4" /> Keluar Permainan
                           </button>
                        </div>
                     )}
                  </div>
               )}
            </div>
         )}

         {/* RESULT MODAL (POPUP) */}
         {feedbackModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
               
               <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
                  
                  {/* Header Decoration */}
                  <div className={`h-24 w-full absolute top-0 left-0 ${feedbackModal === 'CORRECT' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  
                  {/* Icon */}
                  <div className="relative z-10 flex justify-center mt-12 mb-4">
                      <div className={`w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center shadow-md ${feedbackModal === 'CORRECT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {feedbackModal === 'CORRECT' ? <Check size={48} strokeWidth={4} /> : <X size={48} strokeWidth={4} />}
                      </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 pb-6 pt-0 text-center overflow-y-auto custom-scrollbar">
                     <h2 className={`text-2xl font-bold mb-2 ${feedbackModal === 'CORRECT' ? 'text-green-600' : 'text-red-600'}`}>
                        {feedbackModal === 'CORRECT' ? 'Jawaban Benar!' : 'Kurang Tepat'}
                     </h2>
                     
                     {/* Feedback Text */}
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 mb-4 text-left">
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                           {essayFeedback}
                        </p>
                     </div>

                     {/* Key Answer */}
                     {currentEssayQuestion && (
                        <div className="text-left mb-6">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">KUNCI JAWABAN UTAMA:</p>
                           <p className="text-slate-800 dark:text-slate-100 font-bold text-base leading-snug">
                              {currentEssayQuestion.answerKey}
                           </p>
                        </div>
                     )}

                     <button 
                        onClick={handleNextFromFeedback}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${feedbackModal === 'CORRECT' ? 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-green-900/20' : 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600'}`}
                     >
                        Soal Berikutnya <ArrowLeft className="w-5 h-5 rotate-180" />
                     </button>
                  </div>
               </div>
            </div>
         )}

      </div>
    </div>
  );
};

export default QuizView;
