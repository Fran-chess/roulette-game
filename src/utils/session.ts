/**
 * Utilidades para gestión de sesiones de juego
 */

import type { PlaySession } from '@/types';

/**
 * Verifica si una sesión tiene un jugador registrado válido
 * @param session - La sesión a verificar
 * @returns true si hay un jugador registrado con datos completos
 */
export function isPlayerRegistered(session: PlaySession | null): boolean {
  return !!(
    session && 
    session.status === 'player_registered' && 
    session.nombre && 
    session.email
  );
}

/**
 * Verifica si una sesión está en progreso
 * @param session - La sesión a verificar
 * @returns true si la sesión está en progreso
 */
export function isSessionInProgress(session: PlaySession | null): boolean {
  return !!(session && session.status === 'in_progress');
}

/**
 * Verifica si una sesión está pendiente de registro
 * @param session - La sesión a verificar
 * @returns true si la sesión está pendiente de registro
 */
export function isSessionPendingRegistration(session: PlaySession | null): boolean {
  return !!(session && session.status === 'pending_player_registration');
}

/**
 * Verifica si una sesión está disponible para jugar
 * @param session - La sesión a verificar
 * @returns true si la sesión está disponible para jugar
 */
export function isSessionPlayable(session: PlaySession | null): boolean {
  return !!(
    session && 
    (session.status === 'player_registered' || session.status === 'in_progress') &&
    session.nombre &&
    session.email
  );
} 