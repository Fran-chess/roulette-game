// src/types/index.ts

export interface Participant {
  id: string;
  session_id: string;
  nombre: string;
  apellido?: string;
  email?: string;
  especialidad?: string;
  status?: 'registered' | 'playing' | 'completed' | 'disqualified';
  created_at?: string;
  updated_at?: string;
  started_playing_at?: string;
  completed_at?: string;
}

export interface PrizeFeedback {
  answeredCorrectly: boolean | null;
  explanation: string;
  correctOption: string;
  prizeName: string; // Mantener por compatibilidad, pero siempre será vacío
}

export interface Play {
  id: string;
  session_id: string;
  participant_id?: string;
  admin_id?: string;
  status: 'pending_player_registration' | 'player_registered' | 'playing' | 'completed' | 'archived' | 'closed';
  score?: number;
  premio_ganado?: string;
  lastquestionid?: string;
  answeredcorrectly?: boolean;
  detalles_juego?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface PlaySession {
  id: string;
  session_id: string;
  admin_id: string;
  status: 'pending_player_registration' | 'player_registered' | 'playing' | 'completed' | 'archived' | 'closed';
  created_at: string;
  updated_at: string;
  game_data?: Record<string, unknown>;
}

export interface ParticipantWithPlay {
  participant: Participant;
  play?: Play;
  totalPlays?: number;
  lastPlayDate?: string;
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
  role: 'admin' | 'viewer';
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
  prize?: string; // Mantener por compatibilidad, pero no se usará
  explanation?: string;
}

export type GameState = 'waiting' | 'inGame' | 'ended' | 'screensaver' | 'register' | 'roulette' | 'question' | 'prize';

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
  
  // NUEVA: Cola de participantes
  waitingQueue: Participant[];
  setGameState: (state: GameState) => void;
  addParticipant: (participantData: Omit<Participant, 'id' | 'created_at'>) => void;
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
  fetchActiveSession: () => Promise<PlaySession | null>;
  createNewSession: () => Promise<string | null>;
  closeActiveSession: (sessionId: string) => Promise<boolean>;
  updateSessionStatus: (sessionId: string, status: string) => Promise<boolean>;
  fetchParticipantsStats: () => Promise<ParticipantsStats>;
  fetchParticipantsList: () => Promise<Participant[]>;
  setParticipantsStats: (stats: ParticipantsStats) => void;
  
  // NUEVOS: Handlers de cola
  addToQueue: (participant: Participant) => Promise<void>;
  removeFromQueue: (participantId: string) => Promise<void>;
  moveToNext: () => Promise<void>;
  reorderQueue: (newOrder: Participant[]) => Promise<void>;
  
  // NUEVOS: Sincronización BD
  loadQueueFromDB: (sessionId: string) => Promise<void>;
  saveQueueToDB: (sessionId: string) => Promise<void>;
  syncQueueWithDB: (sessionId: string) => Promise<void>;
  cleanupCompletedFromQueue: () => Promise<void>;
}

// --- NUEVA INTERFAZ AÑADIDA ---
export interface RouletteWheelProps {
  questions: Question[]; // Question ya está definida arriba
  onSpinStateChange?: (spinning: boolean) => void; // Callback opcional para notificar cambios en el estado de spinning
}