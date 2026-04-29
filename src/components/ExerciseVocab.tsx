import React, { useState, useEffect } from 'react';
import { LessonContent } from '../types';
import { generateVocabExercise, generateSpeech } from '../services/geminiService';
import { Loader2, CheckCircle2, XCircle, ChevronRight, RefreshCcw, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playBase64Audio, stopAudio } from '../lib/audio';

interface ExerciseVocabProps {
  content: LessonContent[];
}

interface Question {
  sentence: string;
  correctAnswer: string;
  translation: string;
  options: string[];
}

export const ExerciseVocab: React.FC<ExerciseVocabProps> = ({ content }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);

  const loadExercises = async () => {
    if (content.length === 0) return;
    setIsLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    try {
      const result = await generateVocabExercise(content);
      // Ensure correct answer is in options
      const formatted = result.map((q: Question) => ({
        ...q,
        options: [...new Set([...q.options, q.correctAnswer])].sort(() => Math.random() - 0.5)
      }));
      setQuestions(formatted);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
    return () => stopAudio();
  }, []);

  const speak = async (text: string) => {
    stopAudio();
    try {
      const audioData = await generateSpeech(text);
      await playBase64Audio(audioData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnswer = (option: string) => {
    if (isRevealed) return;
    setSelectedAnswer(option);
    setIsRevealed(true);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsRevealed(false);
    } else {
      // Finished
      setCurrentIndex(questions.length);
    }
  };

  if (content.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
        <p className="text-slate-500 font-medium">Vui lòng thêm nội dung bài học trước khi làm bài tập.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-slate-400" size={40} />
        <p className="text-slate-500 font-medium animate-pulse">Đang tạo bài tập cá nhân hóa...</p>
      </div>
    );
  }

  if (currentIndex >= questions.length && questions.length > 0) {
    return (
      <div className="text-center py-16 card-sleek space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-text-main">Hoàn thành!</h2>
          <p className="text-text-muted">Kết quả luyện tập hôm nay của bạn</p>
        </div>
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <span className="block text-4xl font-bold text-primary">{score}/{questions.length}</span>
            <span className="text-[10px] text-text-light uppercase tracking-widest font-bold">Điểm số</span>
          </div>
        </div>
        <button
          onClick={loadExercises}
          className="btn-primary-sleek flex items-center gap-2 mx-auto"
        >
          <RefreshCcw size={18} /> Thử lại bài khác
        </button>
      </div>
    );
  }

  if (!questions[currentIndex]) return null;

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-text-main">Điền từ vào chỗ trống</h2>
          <p className="text-sm text-text-muted">Hoàn thiện câu bằng từ vựng thích hợp</p>
        </div>
        <span className="text-xs font-bold text-text-light uppercase tracking-widest">Câu {currentIndex + 1}/{questions.length}</span>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="card-sleek p-8 space-y-8"
      >
        <div className="space-y-4 text-center">
          <div className="bg-bg-base p-8 rounded-xl border border-border-base relative group">
            <button
              onClick={() => speak(currentQuestion.sentence)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white shadow-sm border border-border-base text-text-light hover:text-primary transition-all opacity-0 group-hover:opacity-100"
            >
              <Volume2 size={18} />
            </button>
            <p className="text-2xl font-bold leading-relaxed text-text-main whitespace-pre-wrap">
              {currentQuestion.sentence}
            </p>
            <p className="text-text-muted italic mt-4">"{currentQuestion.translation}"</p>
          </div>
        </div>

        <div className="grid gap-3">
          {currentQuestion.options.map((option, i) => {
            const isCorrect = option === currentQuestion.correctAnswer;
            const isSelected = selectedAnswer === option;
            let bgColor = 'bg-white hover:bg-slate-50 border-border-base';
            let textColor = 'text-text-main';

            if (isRevealed) {
              if (isCorrect) {
                bgColor = 'bg-emerald-50 border-emerald-200';
                textColor = 'text-emerald-700';
              } else if (isSelected) {
                bgColor = 'bg-rose-50 border-rose-200';
                textColor = 'text-rose-700';
              } else {
                bgColor = 'bg-white opacity-40';
              }
            }

            return (
              <button
                key={i}
                disabled={isRevealed}
                onClick={() => handleAnswer(option)}
                className={`flex justify-between items-center w-full p-4 rounded-xl border transition-all text-left font-bold ${bgColor} ${textColor}`}
              >
                <span>{option}</span>
                {isRevealed && isCorrect && <CheckCircle2 size={20} className="text-emerald-600" />}
                {isRevealed && isSelected && !isCorrect && <XCircle size={20} className="text-rose-600" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pt-4 flex justify-end"
            >
              <button
                onClick={nextQuestion}
                className="btn-primary-sleek flex items-center gap-2 group"
              >
                Tiếp theo <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
