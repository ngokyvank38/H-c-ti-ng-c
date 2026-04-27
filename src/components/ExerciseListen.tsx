import React, { useState, useEffect, useRef } from 'react';
import { LessonContent, Dialogue } from '../types';
import { generateDailyDialogue } from '../services/geminiService';
import { Loader2, Play, Pause, Volume2, Globe, Eye, EyeOff, RefreshCcw, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveText } from './InteractiveText';

interface ExerciseListenProps {
  content: LessonContent[];
}

export const ExerciseListen: React.FC<ExerciseListenProps> = ({ content }) => {
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef(false);

  const loadDialogue = async () => {
    if (content.length === 0) return;
    setIsLoading(true);
    setDialogue(null);
    setCurrentLineIndex(null);
    setIsAutoPlaying(false);
    autoPlayRef.current = false;
    window.speechSynthesis.cancel();
    try {
      const result = await generateDailyDialogue(content);
      setDialogue(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDialogue();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = (text: string, index: number) => {
    setIsAutoPlaying(false);
    autoPlayRef.current = false;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.8;
    
    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentLineIndex(index);
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentLineIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const playAll = () => {
    if (!dialogue || isLoading) return;
    setIsAutoPlaying(true);
    autoPlayRef.current = true;
    playLineSequentially(0);
  };

  const stopAll = () => {
    setIsAutoPlaying(false);
    autoPlayRef.current = false;
    window.speechSynthesis.cancel();
    setCurrentLineIndex(null);
    setIsPlaying(false);
  };

  const playLineSequentially = (index: number) => {
    if (!dialogue || index >= dialogue.lines.length || !autoPlayRef.current) {
      setIsAutoPlaying(false);
      autoPlayRef.current = false;
      setCurrentLineIndex(null);
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(dialogue.lines[index].text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.8;

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentLineIndex(index);
    };

    utterance.onend = () => {
      if (autoPlayRef.current) {
        setTimeout(() => {
          if (autoPlayRef.current) {
            playLineSequentially(index + 1);
          }
        }, 600);
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  if (content.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
        <p className="text-slate-500 font-medium">Vui lòng thêm nội dung bài học trước khi luyện nghe.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-slate-400" size={40} />
        <p className="text-slate-500 font-medium animate-pulse">Đang biên soạn hội thoại phù hợp với trình độ của bạn...</p>
      </div>
    );
  }

  if (!dialogue) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-text-main">{dialogue.title}</h2>
            <span className="bg-primary-light text-primary px-2 py-1 rounded text-[10px] font-bold border border-primary/10 uppercase tracking-wider">
              {dialogue.level}
            </span>
          </div>
          <p className="text-sm text-text-muted">Cải thiện kỹ năng nghe qua hội thoại</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-text-muted px-4 py-2 rounded-lg hover:bg-slate-50 border border-border-base transition-all text-sm font-semibold"
          >
            {showTranslations ? <EyeOff size={16} /> : <Eye size={16} />} 
            {showTranslations ? 'Ẩn dịch' : 'Hiện dịch'}
          </button>
          <button
            onClick={loadDialogue}
            className="flex-1 sm:flex-none btn-primary-sleek flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCcw size={16} /> Bài mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card-sleek overflow-hidden p-0">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Volume2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Trình phát bài nghe</p>
                  <p className="font-bold">{dialogue.title}</p>
                </div>
              </div>
              
              <button
                onClick={isAutoPlaying ? stopAll : playAll}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-bold ${
                  isAutoPlaying 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' 
                    : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                }`}
              >
                {isAutoPlaying ? (
                  <>
                    <Square size={14} fill="currentColor" /> Dừng phát
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" /> Phát toàn bộ
                  </>
                )}
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {dialogue.lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group flex items-start gap-4 p-4 rounded-xl transition-all ${
                    currentLineIndex === i ? 'bg-primary-light border-l-4 border-primary' : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <button
                    onClick={() => speak(line.text, i)}
                    className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      currentLineIndex === i ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-text-light group-hover:bg-slate-200 group-hover:text-text-muted'
                    }`}
                  >
                    {currentLineIndex === i ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-text-light uppercase tracking-widest">{line.speaker}</span>
                    </div>
                    <div className={`text-base transition-colors font-medium ${currentLineIndex === i ? 'text-primary' : 'text-text-main'}`}>
                      <InteractiveText text={line.text} lessons={content} />
                    </div>
                    <AnimatePresence>
                      {showTranslations && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-text-muted italic pt-1"
                        >
                          {line.translation}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-border-base text-center">
              <p className="text-[10px] font-bold text-text-light uppercase tracking-wider">Mẹo: Nhấn nút phát để nghe phát âm chuẩn</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-sleek space-y-4">
            <h3 className="text-[10px] font-bold text-text-main uppercase tracking-[0.2em] border-b border-border-base pb-3">Từ vựng & Cấu trúc</h3>
            <div className="space-y-4">
              {dialogue.explanations?.map((exp, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-sm font-bold text-primary">{exp.word}</p>
                  <p className="text-xs text-text-main leading-relaxed">{exp.meaning}</p>
                  {exp.usage && <p className="text-[10px] text-text-light italic mt-1">Cách dùng: {exp.usage}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="card-sleek space-y-4">
            <h3 className="text-[10px] font-bold text-text-main uppercase tracking-[0.2em] border-b border-border-base pb-3">Phân tích Ngữ pháp</h3>
            <div className="space-y-4">
              {dialogue.grammarNotes?.map((note, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0 opacity-50"></div>
                  <p className="text-xs text-text-muted leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
