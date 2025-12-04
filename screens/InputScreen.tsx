import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { translateText, scanImage } from '../services/geminiService';
import { TranslationResult } from '../types';
import { useHistory } from '../contexts/HistoryContext';
import { v4 as uuidv4 } from 'uuid';
import Toast from '../components/Toast';
import { 
  ArrowLeft, 
  Loader2, 
  Delete as DeleteIcon, 
  CornerDownLeft,
  Keyboard,
  Mic,
  MicOff,
  SendHorizontal,
  Camera,
  BookOpen,
  Image as ImageIcon,
  X
} from 'lucide-react';

interface InputScreenProps {
  fontSize: number;
}

const HARAKAT = ['َ', 'ِ', 'ُ', 'ً', 'ٍ', 'ٌ', 'ْ', 'ّ'];

// Layout Huruf (Mirip QWERTY Arabic)
const ROW_1 = ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'];
const ROW_2 = ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'];
const ROW_3 = ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ']; 

const NUMBERS = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠'];
const SYMBOLS_1 = ['-', '/', ':', '؛', '(', ')', '!', '؟', '"', '\''];
const SYMBOLS_2 = ['[', ']', '{', '}', '#', '%', '*', '+', '=', '_'];

interface KeyBtnProps {
  label?: string | React.ReactNode;
  char?: string;
  type?: 'char' | 'action' | 'space' | 'submit';
  width?: string; // Tailwind width class
  onClick?: () => void;
}

// MOVED OUTSIDE to prevent re-renders and focus loss
const KeyBtn: React.FC<KeyBtnProps> = ({ label, char, type = 'char', width = 'flex-1', onClick }) => {
  const content = label || char;
  
  let bgClass = 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] border-b-2 border-slate-200 dark:border-slate-900';
  if (type === 'action') bgClass = 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] border-b-2 border-slate-400 dark:border-slate-800';
  if (type === 'submit') bgClass = 'bg-blue-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] border-b-2 border-blue-800';
  if (type === 'space') bgClass = 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] border-b-2 border-slate-200 dark:border-slate-900';

  return (
    <button 
      onClick={onClick}
      className={`
        ${width} h-11 mx-0.5 rounded-lg font-bold text-xl flex items-center justify-center transition-all active:scale-95 active:bg-opacity-80
        ${bgClass}
        ${char ? 'font-arabic pb-1' : ''}
      `}
    >
      {content}
    </button>
  );
};

const InputScreen: React.FC<InputScreenProps> = ({ fontSize }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToHistory } = useHistory();
  
  const [inputText, setInputText] = useState((location.state as any)?.initialText || '');
  const [loading, setLoading] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'arab' | 'indo'>('arab');
  const [isListening, setIsListening] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState<'letters' | 'numbers'>('letters');
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message: string) => setToast({ show: true, message });

  // Focus textarea when switching tabs
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeTab]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(prev => prev + (prev ? ' ' : '') + transcript);
            setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        showToast("Browser tidak mendukung fitur suara");
        return;
    }

    if (isListening) {
        recognitionRef.current.stop();
    } else {
        recognitionRef.current.lang = activeTab === 'arab' ? 'ar-SA' : 'id-ID';
        recognitionRef.current.start();
        setIsListening(true);
    }
  };

  const handleCameraIconClick = () => {
    setShowCameraMenu(!showCameraMenu);
  };

  // Reusable Image Processor
  const processImage = async (base64Data: string, mimeType: string) => {
    setIsOcrProcessing(true);
    try {
      const extractedText = await scanImage(base64Data, mimeType);
      setInputText(prev => prev + (prev ? '\n' : '') + extractedText);
    } catch (e) {
      console.error(e);
      showToast("Gagal memindai teks dari gambar");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Camera Logic
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        // Short timeout to allow modal to render
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        }, 100);
    } catch (err) {
        console.error("Camera error:", err);
        showToast("Gagal membuka kamera");
        setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
      setIsCameraOpen(false);
  };

  const captureImage = () => {
      if (videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0);
              // Use JPEG with 0.8 quality
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              const base64Data = dataUrl.split(',')[1];
              processImage(base64Data, 'image/jpeg');
              stopCamera();
          }
      }
  };

  const handleTakePhoto = () => {
    setShowCameraMenu(false);
    startCamera();
  };

  const handleChooseGallery = () => {
    setShowCameraMenu(false);
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Str = reader.result as string;
          const base64Data = base64Str.split(',')[1];
          processImage(base64Data, file.type);
        } catch (e) {
          console.error(e);
          showToast("Gagal membaca file");
        }
      };
      event.target.value = ''; // Reset input so same file can be selected again
    }
  };

  const insertChar = (char: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setInputText(prev => prev + char);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = inputText;
    const newText = text.substring(0, start) + char + text.substring(end);
    setInputText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  };

  const handleBackspace = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === 0 && end === 0) return;
    
    const text = inputText;
    let newText = '';
    let newCursorPos = start;

    if (start === end) {
      newText = text.substring(0, start - 1) + text.substring(end);
      newCursorPos = start - 1;
    } else {
      newText = text.substring(0, start) + text.substring(end);
      newCursorPos = start;
    }
    
    setInputText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);

    try {
      const translation = await translateText(inputText);
      
      const newResult: TranslationResult = {
        id: uuidv4(),
        originalText: inputText,
        maknaGandul: translation.maknaGandul,
        modernTranslation: translation.modernTranslation,
        nahwuShorof: (translation as any).nahwuShorof,
        lughah: (translation as any).lughah,
        balaghah: (translation as any).balaghah,
        ushulFiqh: (translation as any).ushulFiqh,
        hikmah: (translation as any).hikmah,
        referensi: (translation as any).referensi,
        aiExplanation: (translation as any).aiExplanation,
        createdAt: new Date().toISOString(),
        synced: false
      };

      // Add to Global History
      addToHistory({
        id: newResult.id,
        type: 'translation',
        title: newResult.originalText,
        subtitle: newResult.modernTranslation,
        timestamp: newResult.createdAt,
        path: '/result',
        data: newResult
      });

      navigate('/result', { state: { result: newResult } });

    } catch (error) {
      showToast("Gagal menerjemahkan. Periksa internet");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden h-[100dvh]">
       <Toast message={toast.message} isVisible={toast.show} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
       
       {/* Camera Overlay */}
       {isCameraOpen && (
           <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in">
               <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                   <video 
                       ref={videoRef} 
                       autoPlay 
                       playsInline 
                       className="w-full h-full object-cover"
                   />
                   {/* Capture Guide/Frame */}
                   <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none">
                       <div className="w-full h-full border-2 border-white/50 relative">
                           <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500"></div>
                           <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500"></div>
                           <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500"></div>
                           <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500"></div>
                       </div>
                   </div>
               </div>
               
               <div className="h-28 bg-black flex items-center justify-around pb-6 pt-2">
                   <button onClick={stopCamera} className="p-4 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                       <X size={24} />
                   </button>
                   <button 
                     onClick={captureImage} 
                     className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
                   >
                       <div className="w-14 h-14 rounded-full bg-white border-2 border-black"></div>
                   </button>
                   <div className="w-14"></div> {/* Spacer for balance */}
               </div>
           </div>
       )}

       {/* Header */}
       <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 flex items-center gap-4 shadow-sm relative z-20 shrink-0">
          <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
             <ArrowLeft size={24} strokeWidth={3} />
          </button>
          <div className="flex-1">
             <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Keyboard size={24} strokeWidth={3} className="text-santri-green" />
                Input Teks
             </h1>
             {/* Indikator Kamus Munawwir */}
             {activeTab === 'indo' && (
                <div className="flex items-center gap-1.5 mt-0.5">
                   <BookOpen size={12} strokeWidth={3} className="text-santri-gold" />
                   <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Gaya Terjemahan: Kamus Al-Munawwir</p>
                </div>
             )}
          </div>
       </div>

       {/* Text Area */}
       <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            // Suppress system keyboard only for Arabic tab
            inputMode={activeTab === 'arab' ? 'none' : 'text'}
            placeholder={activeTab === 'arab' ? "Ketik teks Arab di sini..." : "Ketik teks Indonesia di sini..."}
            className={`w-full h-full p-4 bg-transparent outline-none resize-none text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 ${
               activeTab === 'arab' ? 'font-arabic text-right' : 'font-sans text-left'
            }`}
            style={{ fontSize: `${fontSize + 8}px` }}
            dir={activeTab === 'arab' ? 'rtl' : 'ltr'}
          />
          
          {isListening && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-in fade-in">
                  <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse mb-4">
                      <Mic size={40} className="text-white" />
                  </div>
                  <p className="text-white font-bold text-lg">Mendengarkan...</p>
                  <p className="text-white/80 text-sm mt-2">Katakan sesuatu dalam bahasa {activeTab === 'arab' ? 'Arab' : 'Indonesia'}</p>
              </div>
          )}

          {isOcrProcessing && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-in fade-in">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                      <Loader2 size={32} className="text-white animate-spin" />
                  </div>
                  <p className="text-white font-bold text-lg">Memindai Gambar...</p>
                  <p className="text-white/80 text-sm mt-2">AI sedang mengekstrak teks</p>
              </div>
          )}
       </div>

       {/* Toolbar & Keyboard Container */}
       <div className="bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-800 z-30 shrink-0 transition-all duration-300 flex flex-col shadow-inner relative">
          
          {/* Camera Menu Popup */}
          {showCameraMenu && (
            <>
              <div className="absolute bottom-full left-4 mb-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <button onClick={handleTakePhoto} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-4 border-b border-slate-100 dark:border-slate-700">
                   <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0">
                      <Camera size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Kamera</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Ambil foto baru</p>
                   </div>
                </button>
                <button onClick={handleChooseGallery} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                      <ImageIcon size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Galeri</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Pilih dari HP</p>
                   </div>
                </button>
              </div>
              {/* Overlay to close menu */}
              <div className="fixed inset-0 z-40" onClick={() => setShowCameraMenu(false)}></div>
            </>
          )}

          {/* Action Bar */}
          <div className="flex items-center gap-2 p-2 px-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 relative z-30">
              <button onClick={toggleListening} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 border border-slate-200 dark:border-slate-700 ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  {isListening ? <MicOff size={20} strokeWidth={3} /> : <Mic size={20} strokeWidth={3} />}
              </button>

              <div className="relative">
                <button 
                  onClick={handleCameraIconClick} 
                  disabled={isOcrProcessing}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 border border-slate-200 dark:border-slate-700 ${showCameraMenu ? 'bg-santri-green text-white border-santri-green' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                   <Camera size={20} strokeWidth={3} />
                </button>
                {/* Hidden Input for Gallery */}
                <input type="file" ref={galleryInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              {/* Tabs Switcher */}
              <div className="flex-1 flex bg-slate-100 dark:bg-slate-800 rounded-full p-1 mx-2 border border-slate-200 dark:border-slate-700">
                <button onClick={() => setActiveTab('arab')} className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'arab' ? 'bg-white dark:bg-slate-700 shadow-sm text-santri-green dark:text-santri-gold border border-slate-100 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>Arab</button>
                <button onClick={() => setActiveTab('indo')} className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'indo' ? 'bg-white dark:bg-slate-700 shadow-sm text-santri-green dark:text-santri-gold border border-slate-100 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>Indonesia</button>
              </div>

              <button onClick={handleTranslate} disabled={loading || !inputText.trim()} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${loading || !inputText.trim() ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : 'bg-santri-green text-white hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none'}`}>
                 {loading ? <Loader2 size={20} className="animate-spin" /> : <SendHorizontal size={20} strokeWidth={3} />}
              </button>
          </div>

          {/* Virtual Arabic Keyboard */}
          {activeTab === 'arab' && (
             <div 
               className="bg-[#cfd5da] dark:bg-[#1a1f26] p-1.5 select-none relative z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]"
               style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
             >
               
               {/* Harakat Row (Scrollable) */}
               <div className="flex gap-1 mb-2 px-1">
                 {HARAKAT.map((char) => (
                   <button 
                     key={char} 
                     onClick={() => insertChar(char)} 
                     className="flex-1 h-12 bg-slate-300 dark:bg-slate-700 rounded-lg text-2xl font-arabic text-slate-800 dark:text-slate-200 active:bg-slate-400 transition-colors shadow-sm border-b-2 border-slate-400 dark:border-slate-900 flex items-center justify-center pt-2 leading-none"
                   >
                     {/* Combine with Tatweel for proper rendering position */}
                     <span className="opacity-30">ـ</span>{char}
                   </button>
                 ))}
               </div>
               
               {/* LETTERS MODE */}
               {keyboardMode === 'letters' && (
                 <div className="flex flex-col gap-2">
                    {/* Row 1 */}
                    <div className="flex gap-1 px-0.5">
                       {ROW_1.map(char => <KeyBtn key={char} char={char} onClick={() => insertChar(char)} />)}
                    </div>
                    {/* Row 2 */}
                    <div className="flex gap-1 px-4">
                       {ROW_2.map(char => <KeyBtn key={char} char={char} onClick={() => insertChar(char)} />)}
                    </div>
                    {/* Row 3 (With Extra chars & Backspace) */}
                    <div className="flex gap-1 px-1">
                       <KeyBtn char="د" onClick={() => insertChar('د')} width="w-[9%]" />
                       <KeyBtn char="ذ" onClick={() => insertChar('ذ')} width="w-[9%]" />
                       {ROW_3.map(char => <KeyBtn key={char} char={char} onClick={() => insertChar(char)} />)}
                       <KeyBtn label={<DeleteIcon size={20} strokeWidth={3} />} type="action" width="w-[14%]" onClick={handleBackspace} />
                    </div>
                 </div>
               )}

               {/* NUMBERS & SYMBOLS MODE */}
               {keyboardMode === 'numbers' && (
                 <div className="flex flex-col gap-2">
                    {/* Numbers */}
                    <div className="flex gap-1">
                       {NUMBERS.map(char => <KeyBtn key={char} char={char} onClick={() => insertChar(char)} />)}
                    </div>
                    {/* Symbols 1 */}
                    <div className="flex gap-1">
                       {SYMBOLS_1.map(char => <KeyBtn key={char} char={char} onClick={() => insertChar(char)} />)}
                    </div>
                    {/* Symbols 2 & Backspace */}
                    <div className="flex gap-1">
                       {SYMBOLS_2.map(char => <KeyBtn key={char} char={char} onClick={() => insertChar(char)} />)}
                       <KeyBtn label={<DeleteIcon size={20} strokeWidth={3} />} type="action" width="w-[15%]" onClick={handleBackspace} />
                    </div>
                 </div>
               )}

               {/* BOTTOM ROW (Common) */}
               <div className="flex gap-2 mt-2 h-11 px-1">
                  <KeyBtn 
                    label={keyboardMode === 'letters' ? '١٢٣' : 'أ ب ت'} 
                    type="action" 
                    width="w-[15%]" 
                    onClick={() => setKeyboardMode(prev => prev === 'letters' ? 'numbers' : 'letters')} 
                  />
                  
                  <KeyBtn label="،" char="،" width="w-[10%]" onClick={() => insertChar('،')} />
                  
                  <KeyBtn label="Spasi" type="space" width="flex-1" onClick={() => insertChar(' ')} />
                  
                  <KeyBtn label="." char="." width="w-[10%]" onClick={() => insertChar('.')} />
                  
                  <KeyBtn 
                    label={<CornerDownLeft size={20} strokeWidth={3} />} 
                    type="submit" 
                    width="w-[15%]" 
                    onClick={() => insertChar('\n')} 
                  />
               </div>
             </div>
          )}
       </div>
    </div>
  );
};

export default InputScreen;
