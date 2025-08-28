
import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}

export interface Player {
  uid: string;
  name: string;
  photoURL: string | null;
  score: number;
}

export interface Room {
  id: string;
  name: string;
  host: {
    uid: string;
    name: string;
  };
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Timestamp;
  currentQuestionIndex: number;
  questionIds: string[];
  answers?: Record<string, Record<string, Answer>>;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of the correct option
  difficulty: number; // 1-10
}

export interface Answer {
  userId: string;
  isCorrect: boolean;
  timestamp: Timestamp;
  answerIndex: number;
}
