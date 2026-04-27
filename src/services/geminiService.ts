import { GoogleGenAI, Type } from "@google/genai";
import { LessonContent, Dialogue } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateVocabExercise = async (content: LessonContent[]) => {
  const allVocab = content.flatMap(c => c.vocabulary);
  const allGrammar = content.flatMap(c => c.grammar);
  if (allVocab.length === 0) return null;

  const prompt = `Based on these German vocabulary words and grammar points:
  Vocabulary: ${JSON.stringify(allVocab)}
  Grammar/Examples: ${JSON.stringify(allGrammar)}
  
  Generate exactly 5 "fill in the blank" exercises. 
  MANDATORY: 
  - Each question MUST focus on one of the vocabulary words provided.
  - The sentence structure should reflect the grammar points if possible.
  - For each exercise, provide:
    1. A German sentence with the target word missing (replaced with "_____").
    2. The correct missing word.
    3. A Vietnamese translation of the sentence.
    4. 3 distracting wrong options in German that are plausible but incorrect.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sentence: { type: Type.STRING },
            correctAnswer: { type: Type.STRING },
            translation: { type: Type.STRING },
            options: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["sentence", "correctAnswer", "translation", "options"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateDailyDialogue = async (content: LessonContent[]): Promise<Dialogue> => {
  const vocab = content.flatMap(c => c.vocabulary.map(v => v.german)).slice(-30);
  const grammar = content.flatMap(c => c.grammar.map(g => g.title)).slice(-8);
  const lessonCount = content.length;
  
  // Complexity increases with the number of lessons
  const level = lessonCount < 5 ? 'A1' : lessonCount < 12 ? 'A2' : lessonCount < 20 ? 'B1' : 'B2';

  const prompt = `Create an immersive German dialogue (6-10 lines) for a listening exercise at level ${level}.
  Context: Based on user's recent lessons but expanding into real-life situations (at the university, workplace, doctor, or grocery store).
  Vocabulary focus: ${vocab.join(", ")}
  Grammar focus: ${grammar.join(", ")}
  
  Please provide:
  1. A title.
  2. Level (${level}).
  3. The dialogue lines with translations.
  4. A list of key vocabulary/phrases from the dialogue with Vietnamese meanings.
  5. A few short grammar notes explaining structures used in the dialogue.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          level: { type: Type.STRING, enum: ["A1", "A2", "B1", "B2"] },
          lines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: { type: Type.STRING },
                text: { type: Type.STRING },
                translation: { type: Type.STRING }
              },
              required: ["speaker", "text", "translation"]
            }
          },
          explanations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                meaning: { type: Type.STRING },
                usage: { type: Type.STRING }
              },
              required: ["word", "meaning"]
            }
          },
          grammarNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["title", "level", "lines", "explanations", "grammarNotes"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateCommunicationExercise = async (content: LessonContent[]) => {
  const vocab = content.flatMap(c => c.vocabulary.map(v => v.german)).slice(-40);
  const grammar = content.flatMap(c => c.grammar.map(g => g.title)).slice(-10);
  
  const prompt = `Create a realistic roleplay scenario in German. 
  MANDATORY: Focus on using these vocabulary words: ${vocab.join(", ")} and these grammar points: ${grammar.join(", ")}.
  Scenario should feel more natural and open-ended.
  
  Provide:
  1. A scenario description in Vietnamese.
  2. A starting line from an AI character (German).
  3. A Vietnamese translation of the starting line.
  4. A prompt for the user in Vietnamese.
  5. An ideal model reply in German.
  6. A list of key words in the starting line with their Vietnamese translations for a word-by-word analysis.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenario: { type: Type.STRING },
          aiOpening: { type: Type.STRING },
          aiOpeningTranslation: { type: Type.STRING },
          userHint: { type: Type.STRING },
          idealReply: { type: Type.STRING },
          wordAnalysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                translation: { type: Type.STRING }
              },
              required: ["word", "translation"]
            }
          }
        },
        required: ["scenario", "aiOpening", "aiOpeningTranslation", "userHint", "idealReply", "wordAnalysis"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const evaluateResponse = async (userResponse: string, context: string) => {
  const prompt = `Act as an expert German teacher. Evaluate this user response: "${userResponse}"
  Context: "${context}"
  
  Evaluate based on:
  1. Grammar accuracy.
  2. Vocabulary choice.
  3. Naturalness/Idiomatic usage.
  
  Provide a detailed feedback in Vietnamese. If there are errors, explain them clearly.
  Provide a corrected and more natural version of the sentence.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isCorrect: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING },
          correction: { type: Type.STRING }
        },
        required: ["isCorrect", "feedback"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const translateWord = async (word: string) => {
  const prompt = `Translate the following German word or short phrase to Vietnamese. 
  Just give the Vietnamese translation as a short string, no extra explanation or punctuation.
  Word: "${word}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return response.text.trim();
};
