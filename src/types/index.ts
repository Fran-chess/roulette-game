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

export interface PrizeFeedback {
  answeredCorrectly: boolean | null;
  explanation: string;
  correctOption: string;
  prizeName: string;
}

export interface Play {
  id: string;
  created_at: string;
  participant_id: string;
  score?: number;
  premio_ganado?: string;
  detalles_juego?: Record<string, unknown>;
}

export interface PlaySession {
  id: string;
  session_id: string;
  admin_id: string;
  status: 'pending_player_registration' | 'player_registered' | 'playing' | 'completed' | 'archived';
  nombre?: string;
  apellido?: string;
  email?: string;
  especialidad?: string;
  created_at: string;
  updated_at: string;
  admin_updated_at?: string;
  game_data?: Record<string, unknown>;
  lastquestionid?: string;
  answeredcorrectly?: boolean;
  score?: number;
  premio_ganado?: string;
  participant_id?: string;
  detalles_juego?: Record<string, unknown>;
}

export interface ParticipantsStats {
  count: number;
  participants?: Participant[];
}

export interface AdminState {
  activeSessions: PlaySession[];
  currentSession: PlaySession | null;
  participantsStats: ParticipantsStats;
  isLoading: {
    sessionsList: boolean;
    sessionAction: boolean;
    participants: boolean;
  };
  error: string | null;
  success: string | null;
}

export interface GameSession {
  sessionId: string;
  playerName: string;
  playerEmail?: string;
  participantId: string;
  isActive: boolean;
  createdAt?: string;
  status?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role?: string; // [modificación] Agregar propiedad role opcional
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
  questions: Question[];
  gameSession: PlaySession | null;
  adminState: AdminState;
  prizeFeedback: PrizeFeedback;
  showConfetti: boolean;
  setGameState: (state: GameState) => void;
  addParticipant: (participantData: Omit<Participant, 'id' | 'timestamp'>) => void;
  startPlaySession: (
    userData: { nombre: string; apellido?: string; email: string; especialidad?: string },
    onSuccess?: (data: { participant: Participant, play?: Play, message: string }) => void,
    onError?: (error: Error | unknown) => void
  ) => Promise<void>;
  setCurrentParticipant: (participant: Participant | null) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setLastSpinResultIndex: (index: number | null) => void;
  updateCurrentParticipantScore: (data: { questionId: string; answeredCorrectly: boolean; prizeWon?: string }) => void;
  resetCurrentGame: () => void;
  resetAllData: () => void;
  resetCurrentGameData: () => void;
  setPrizeFeedback: (feedback: PrizeFeedback) => void;
  resetPrizeFeedback: () => void;
  setShowConfetti: (value: boolean) => void;
  fetchGameSessions: () => Promise<PlaySession[]>;
  setGameSession: (sessionData: PlaySession | null) => void;
  setQuestions: (questions: Question[]) => void;
  setAdminCurrentSession: (session: PlaySession | null) => void;
  setAdminLoading: (type: 'sessionsList' | 'sessionAction' | 'participants', isLoading: boolean) => void;
  setAdminNotification: (type: 'error' | 'success', message: string | null) => void;
  clearAdminNotifications: () => void;
  createNewSession: () => Promise<string | null>;
  updateSessionStatus: (sessionId: string, status: string) => Promise<boolean>;
  fetchParticipantsStats: () => Promise<ParticipantsStats>;
  fetchParticipantsList: () => Promise<Participant[]>;
  setParticipantsStats: (stats: ParticipantsStats) => void;
}

// --- NUEVA INTERFAZ AÑADIDA ---
export interface RouletteWheelProps {
  questions: Question[]; // Question ya está definida arriba
}