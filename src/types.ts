/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Vocabulary {
  id?: string;
  german: string;
  vietnamese: string;
  context?: string;
}

export interface GrammarPoint {
  id?: string;
  title: string;
  explanation: string;
  examples: string[];
}

export interface LessonContent {
  id: string;
  title: string;
  date: string;
  vocabulary: Vocabulary[];
  grammar: GrammarPoint[];
}

export type AppTab = 'content' | 'vocab' | 'listen' | 'comm';

export interface ExerciseResult {
  isCorrect: boolean;
  feedback: string;
  correction?: string;
}

export interface Dialogue {
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  lines: {
    speaker: string;
    text: string;
    translation: string;
  }[];
  explanations?: {
    word: string;
    meaning: string;
    usage?: string;
  }[];
  grammarNotes?: string[];
}
