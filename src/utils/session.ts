/**
 * Utilidades para gestión de sesiones de juego
 */

import type { PlaySession } from '@/types';

/**
 * Verifica si una sesión tiene el estado de jugador registrado
 * NOTA: Esta función solo verifica el estado de la sesión.
 * Para verificar si realmente hay un participante, se debe consultar la tabla participants por separado.
 * @param session - La sesión a verificar
 * @returns true si el estado de la sesión es 'player_registered'
 */
export function isPlayerRegistered(session: PlaySession | null): boolean {
  return !!(
    session && 
    session.status === 'player_registered'
  );
}

/**
 * Verifica si una sesión está en progreso
 * @param session - La sesión a verificar
 * @returns true si la sesión está en progreso
 */
export function isSessionInProgress(session: PlaySession | null): boolean {
  return !!(session && session.status === 'playing');
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
 * Verifica si una sesión está disponible para jugar basándose en su estado
 * NOTA: Esta función solo verifica el estado de la sesión.
 * Para verificar si realmente hay un participante, se debe consultar la tabla participants por separado.
 * @param session - La sesión a verificar
 * @returns true si la sesión está disponible para jugar
 */
export function isSessionPlayable(session: PlaySession | null): boolean {
  return !!(
    session &&
    (session.status === 'player_registered' || session.status === 'playing')
  );
}
