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

