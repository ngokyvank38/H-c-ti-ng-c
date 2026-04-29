import React, { useState } from 'react';
import { LessonContent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { translateWord, generateSpeech } from '../services/geminiService';
import { Loader2, Volume2 } from 'lucide-react';
import { playBase64Audio, stopAudio } from '../lib/audio';

interface InteractiveTextProps {
  text: string;
  lessons: LessonContent[];
  className?: string;
  wordClassName?: string;
}

export const InteractiveText: React.FC<InteractiveTextProps> = ({ 
  text, 
  lessons, 
  className = "", 
  wordClassName = "" 
}) => {
  const [activeWord, setActiveWord] = useState<{ word: string; meaning: string; isAI?: boolean } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  
  // Flatten all vocabulary for quick lookup
  const vocabulary = lessons.flatMap(l => l.vocabulary);
  
  const handleWordClick = async (rawWord: string) => {
    // Clean word from punctuation
    const cleanWord = rawWord.replace(/[.,!?;:()]/g, '').toLowerCase();
    
    // Exact match
    let match = vocabulary.find(v => v.german.toLowerCase() === cleanWord);
    
    // Partial match if not found (for conjugated verbs or plural nouns)
    if (!match) {
      match = vocabulary.find(v => 
        cleanWord.includes(v.german.toLowerCase()) || 
        v.german.toLowerCase().includes(cleanWord)
      );
    }

    if (match) {
      setActiveWord({ word: rawWord, meaning: match.vietnamese });
    } else {
      setLoading(rawWord);
      try {
        const translation = await translateWord(cleanWord);
        setActiveWord({ word: rawWord, meaning: translation, isAI: true });
      } catch (error) {
        setActiveWord({ word: rawWord, meaning: "Không thể dịch từ này" });
      } finally {
        setLoading(null);
      }
    }
  };

  const speak = async (text: string) => {
    stopAudio();
    try {
      const audioData = await generateSpeech(text);
      await playBase64Audio(audioData);
    } catch (e) {
      console.error(e);
    }
  };

  const paragraphs = text.split('\n');

  return (
    <div className={`relative ${className}`}>
      {paragraphs.map((paragraph, pIdx) => (
        <div key={pIdx} className="flex flex-wrap gap-x-1 gap-y-0.5 mb-1 last:mb-0">
          {paragraph.split(' ').map((word, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                handleWordClick(word);
              }}
              className={`relative cursor-pointer hover:bg-primary-light hover:text-primary transition-colors rounded px-0.5 ${wordClassName}`}
              disabled={loading === word}
            >
              {word}
              {loading === word && (
                <span className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                </span>
              )}
            </button>
          ))}
        </div>
      ))}

      <AnimatePresence>
        {activeWord && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs py-2 px-3 rounded-xl shadow-xl min-w-[120px] max-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary-light">
                  {activeWord.word}
                  {activeWord.isAI && <span className="ml-2 text-[8px] opacity-50 uppercase tracking-tighter">(AI)</span>}
                </span>
                <button
                  onClick={() => speak(activeWord.word)}
                  className="text-white/30 hover:text-primary-light transition-colors"
                >
                  <Volume2 size={12} />
                </button>
              </div>
              <button 
                onClick={() => setActiveWord(null)}
                className="ml-2 text-white/50 hover:text-white"
              >
                ×
              </button>
            </div>
            <p className="text-[11px] leading-relaxed italic whitespace-pre-wrap">{activeWord.meaning}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
