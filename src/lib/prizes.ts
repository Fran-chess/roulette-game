// Sistema de premios local para TV (sin Supabase)
// Cada ID único puede ganar solo una vez por sesión

const STORAGE_KEY = 'won';

/**
 * Verifica si un ID específico ya puede jugar
 * @param id ID único del participante/sesión
 * @returns true si puede jugar, false si ya ganó
 */
export const canPlay = (id: string): boolean => {
  try {
    const wonList: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return !wonList.includes(id);
  } catch (error) {
    console.error('Error al verificar si puede jugar:', error);
    return true; // En caso de error, permitir jugar
  }
};

/**
 * Marca un ID como ganador para evitar que vuelva a ganar
 * @param id ID único del participante/sesión
 */
export const markWon = (id: string): void => {
  try {
    const wonList: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!wonList.includes(id)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...wonList, id]));
      console.log(`ID ${id} marcado como ganador`);
    }
  } catch (error) {
    console.error('Error al marcar como ganador:', error);
  }
};

/**
 * Obtiene la lista de IDs que ya ganaron (para debug)
 * @returns Array de IDs que ya ganaron
 */
export const getWonList = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('Error al obtener lista de ganadores:', error);
    return [];
  }
};

/**
 * Limpia la lista de ganadores (para reiniciar sesión)
 */
export const clearWonList = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Lista de ganadores limpiada');
  } catch (error) {
    console.error('Error al limpiar lista de ganadores:', error);
  }
};

/**
 * Genera un ID único para una sesión/participante
 * @returns ID único basado en timestamp y random
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}; 