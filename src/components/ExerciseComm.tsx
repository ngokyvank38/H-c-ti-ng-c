import React, { useState, useEffect } from 'react';
import { LessonContent, ExerciseResult } from '../types';
import { generateCommunicationExercise, evaluateResponse } from '../services/geminiService';
import { Loader2, Send, MessageCircle, HelpCircle, CheckCircle, AlertCircle, RefreshCcw, ArrowRight, Volume2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveText } from './InteractiveText';

interface ExerciseCommProps {
  content: LessonContent[];
}

interface Scenario {
  scenario: string;
  aiOpening: string;
  aiOpeningTranslation: string;
  userHint: string;
  idealReply: string;
  wordAnalysis: { word: string; translation: string; }[];
}

export const ExerciseComm: React.FC<ExerciseCommProps> = ({ content }) => {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeWord, setActiveWord] = useState<{ word: string; translation: string } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const loadScenario = async () => {
    if (content.length === 0) return;
    setIsLoading(true);
    setScenario(null);
    setResult(null);
    setUserInput('');
    setShowHint(false);
    setShowTranslation(false);
    setActiveWord(null);
    window.speechSynthesis.cancel();
    try {
      const res = await generateCommunicationExercise(content);
      setScenario(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScenario();
    return () => window.speechSynthesis.cancel();
  }, []);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !scenario || isEvaluating) return;

    setIsEvaluating(true);
    try {
      const evalRes = await evaluateResponse(userInput, `Scenario: ${scenario.scenario}. User hint: ${scenario.userHint}. AI opening: ${scenario.aiOpening}. Ideal reply: ${scenario.idealReply}`);
      setResult(evalRes);
    } catch (error) {
      console.error(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleWordClick = (rawWord: string) => {
    const cleanWord = rawWord.replace(/[.,!?]/g, '').toLowerCase();
    const analysis = scenario?.wordAnalysis.find(wa => wa.word.toLowerCase() === cleanWord);
    if (analysis) {
      setActiveWord(analysis);
    } else {
      // Fallback: search if the word is part of a phrase or has minor differences
      const flexibleMatch = scenario?.wordAnalysis.find(wa => 
        cleanWord.includes(wa.word.toLowerCase()) || wa.word.toLowerCase().includes(cleanWord)
      );
      if (flexibleMatch) setActiveWord(flexibleMatch);
    }
  };

  if (content.length === 0) {
    // ... (rest of guards)
    return (
      <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
        <p className="text-slate-500 font-medium">Vui lòng thêm nội dung bài học để bắt đầu luyện giao tiếp.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-slate-400" size={40} />
        <p className="text-slate-500 font-medium animate-pulse">Đang chuẩn bị tình huống giao tiếp...</p>
      </div>
    );
  }

  if (!scenario) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-text-main">Luyện giao tiếp</h2>
          <p className="text-sm text-text-muted">Phản xạ nhanh qua các tình huống thực tế</p>
        </div>
        <button
          onClick={loadScenario}
          className="flex items-center gap-2 bg-white text-text-muted px-4 py-2 rounded-lg hover:bg-slate-50 border border-border-base transition-all text-sm font-semibold shadow-sm"
        >
          <RefreshCcw size={16} /> Đổi tình huống
        </button>
      </div>

      <div className="bg-white border border-border-base rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-primary-light p-3 rounded-xl">
            <MessageCircle className="text-primary" size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-text-light uppercase tracking-widest">Tình huống</h4>
            <p className="text-text-main font-bold">{scenario.scenario}</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 py-4">
        {/* AI Side */}
        <div className="flex gap-4 max-w-[95%]">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-text-muted font-bold text-xs uppercase border border-white shadow-sm">
            AI
          </div>
          <div className="bg-white border border-border-base p-5 rounded-2xl rounded-tl-none shadow-sm space-y-4 flex-1">
            <div className="flex justify-between items-start">
              <InteractiveText text={scenario.aiOpening} lessons={content} className="flex-1" />
              <button
                onClick={() => speak(scenario.aiOpening)}
                disabled={isSpeaking}
                className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'text-primary bg-primary-light' : 'text-text-light hover:text-primary hover:bg-slate-50'}`}
              >
                <Volume2 size={18} className={isSpeaking ? 'animate-pulse' : ''} />
              </button>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-50">
              <button 
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-text-light hover:text-primary transition-colors uppercase tracking-wider"
              >
                <HelpCircle size={14} /> {showHint ? 'Ẩn gợi ý' : 'Gợi ý phản hồi'}
              </button>
              <button 
                onClick={() => setShowTranslation(!showTranslation)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-text-light hover:text-primary transition-colors uppercase tracking-wider"
              >
                <Eye size={14} /> {showTranslation ? 'Ẩn dịch câu' : 'Dịch cả câu'}
              </button>
            </div>

            <AnimatePresence>
              {(showHint || showTranslation) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 pt-2 overflow-hidden"
                >
                  {showTranslation && (
                    <div className="text-sm text-text-muted italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="font-bold text-text-light">Bản dịch:</span> {scenario.aiOpeningTranslation}
                    </div>
                  )}
                  {showHint && (
                    <div className="text-sm text-text-muted italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="font-bold text-text-light">Gợi ý:</span> {scenario.userHint}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* User Side */}
        <div className="flex flex-col items-end space-y-4">
          <form onSubmit={handleSubmit} className="w-full flex items-start gap-4 justify-end">
            <div className="w-full max-w-[85%] relative">
              <textarea
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                disabled={!!result || isEvaluating}
                placeholder="Nhập câu trả lời bằng tiếng Đức..."
                className="w-full bg-primary text-white border-0 rounded-2xl rounded-tr-none p-5 pr-14 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-base placeholder:text-white/60 resize-none min-h-[100px] shadow-lg"
              />
              <button
                type="submit"
                disabled={!userInput.trim() || !!result || isEvaluating}
                className={`absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  userInput.trim() && !result && !isEvaluating ? 'bg-white text-primary shadow-md hover:scale-110' : 'bg-white/10 text-white/30 pointer-events-none'
                }`}
              >
                {isEvaluating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-bold text-xs uppercase shadow-md">
              VN
            </div>
          </form>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full max-w-[85%] p-6 rounded-2xl border ${
                  result.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                } space-y-4 shadow-sm mr-14`}
              >
                <div className="flex items-center gap-3">
                  {result.isCorrect ? (
                    <CheckCircle className="text-emerald-500" size={24} />
                  ) : (
                    <AlertCircle className="text-amber-500" size={24} />
                  )}
                  <h4 className={`font-bold text-xs uppercase tracking-wider ${
                    result.isCorrect ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {result.isCorrect ? 'Tuyệt vời!' : 'Nhận xét'}
                  </h4>
                </div>
                
                <p className="text-text-main text-sm leading-relaxed">{result.feedback}</p>
                
                {result.correction && (
                  <div className="bg-white/60 p-4 rounded-xl border border-white flex justify-between items-start group">
                    <div>
                      <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">Câu sửa lại</p>
                      <p className="text-text-main italic font-medium">{result.correction}</p>
                    </div>
                    <button
                      onClick={() => speak(result.correction!)}
                      className="text-text-light hover:text-primary transition-colors p-1"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                )}

                <button
                  onClick={loadScenario}
                  className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider hover:translate-x-1 transition-transform"
                >
                  Tình huống tiếp theo <ArrowRight size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
