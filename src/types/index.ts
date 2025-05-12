// src/types/index.ts

export interface Participant {
  id: string;
  created_at?: string;
  timestamp?: Date;
  nombre: string;
  apellido?: string;
  email?: string;
  especialidad?: string;
  lastQuestionId?: string;
  answeredCorrectly?: boolean;
  prizeWon?: string;
  play_count?: number;
}

export interface Play {
  id: string;
  created_at: string;
  participant_id: string;
  score?: number;
  premio_ganado?: string;
  detalles_juego?: any;
}

export interface AnswerOption {
  text: string;
  correct: boolean;
}

export interface Question {
  id: string;
  category: string;
  text: string;
  options: AnswerOption[];
  prize?: string;
  explanation?: string;
}

export type GameState = 'screensaver' | 'register' | 'roulette' | 'question' | 'prize' | 'ended';

export interface GameStore {
  gameState: GameState;
  participants: Participant[];
  currentParticipant: Participant | null;
  currentQuestion: Question | null;
  lastSpinResultIndex: number | null;
  currentPlay: Play | null;
  setGameState: (state: GameState) => void;
  addParticipant: (participantData: Omit<Participant, 'id' | 'timestamp'>) => void;
  startPlaySession: (
    userData: { nombre: string; apellido?: string; email: string },
    onSuccess?: (data: { participant: Participant, play?: Play, message: string }) => void,
    onError?: (error: any) => void
  ) => Promise<void>;
  setCurrentParticipant: (participant: Participant | null) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setLastSpinResultIndex: (index: number | null) => void;
  updateCurrentParticipantScore: (data: { questionId: string; answeredCorrectly: boolean; prizeWon?: string }) => void;
  resetCurrentGame: () => void;
  resetAllData: () => void;
}

// --- NUEVA INTERFAZ AÑADIDA ---
export interface RouletteWheelProps {
  questions: Question[]; // Question ya está definida arriba
}