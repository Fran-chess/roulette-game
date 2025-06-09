import { supabaseAdmin } from '@/lib/supabase';
import { tvProdLogger } from '@/utils/tvLogger';

/**
 * Verifica si un participante ya ganó un premio en cualquier sesión
 * @param participantId - ID del participante
 * @returns Promise<boolean> - true si ya ganó un premio
 */
export async function hasParticipantWonPrize(participantId: string): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      tvProdLogger.error('hasParticipantWonPrize: supabaseAdmin no disponible');
      return false;
    }

    const { data: previousWins, error } = await supabaseAdmin
      .from('plays')
      .select('id, premio_ganado, created_at')
      .eq('participant_id', participantId)
      .not('premio_ganado', 'is', null)
      .neq('premio_ganado', '')
      .limit(1);

    if (error) {
      tvProdLogger.error('hasParticipantWonPrize: Error consultando premios:', error);
      return false;
    }

    return previousWins && previousWins.length > 0;
  } catch (error) {
    tvProdLogger.error('hasParticipantWonPrize: Error:', error);
    return false;
  }
}

/**
 * Obtiene el primer premio ganado por un participante
 * @param participantId - ID del participante
 * @returns Promise<{ prize: string; date: string } | null>
 */
export async function getParticipantFirstPrize(participantId: string): Promise<{ prize: string; date: string } | null> {
  try {
    if (!supabaseAdmin) {
      tvProdLogger.error('getParticipantFirstPrize: supabaseAdmin no disponible');
      return null;
    }

    const { data: firstWin, error } = await supabaseAdmin
      .from('plays')
      .select('premio_ganado, created_at')
      .eq('participant_id', participantId)
      .not('premio_ganado', 'is', null)
      .neq('premio_ganado', '')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !firstWin) {
      return null;
    }

    return {
      prize: firstWin.premio_ganado as string,
      date: firstWin.created_at as string
    };
  } catch (error) {
    tvProdLogger.error('getParticipantFirstPrize: Error:', error);
    return null;
  }
}

/**
 * Cuenta el total de jugadas de un participante
 * @param participantId - ID del participante
 * @returns Promise<number>
 */
export async function getParticipantPlaysCount(participantId: string): Promise<number> {
  try {
    if (!supabaseAdmin) {
      tvProdLogger.error('getParticipantPlaysCount: supabaseAdmin no disponible');
      return 0;
    }

    const { count, error } = await supabaseAdmin
      .from('plays')
      .select('id', { count: 'exact' })
      .eq('participant_id', participantId);

    if (error) {
      tvProdLogger.error('getParticipantPlaysCount: Error:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    tvProdLogger.error('getParticipantPlaysCount: Error:', error);
    return 0;
  }
}

/**
 * Obtiene estadísticas completas de un participante
 * @param participantId - ID del participante
 * @returns Promise<ParticipantStats>
 */
export interface ParticipantStats {
  totalPlays: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hasPrize: boolean;
  firstPrize?: { prize: string; date: string };
  successRate: number;
}

export async function getParticipantStats(participantId: string): Promise<ParticipantStats> {
  try {
    if (!supabaseAdmin) {
      tvProdLogger.error('getParticipantStats: supabaseAdmin no disponible');
      return {
        totalPlays: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        hasPrize: false,
        successRate: 0
      };
    }

    // Obtener todas las jugadas del participante
    const { data: plays, error: playsError } = await supabaseAdmin
      .from('plays')
      .select('answeredcorrectly, premio_ganado, created_at')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: true });

    if (playsError) {
      tvProdLogger.error('getParticipantStats: Error obteniendo jugadas:', playsError);
      return {
        totalPlays: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        hasPrize: false,
        successRate: 0
      };
    }

    const totalPlays = plays?.length || 0;
    const correctAnswers = plays?.filter(play => play.answeredcorrectly === true).length || 0;
    const incorrectAnswers = totalPlays - correctAnswers;
    const successRate = totalPlays > 0 ? (correctAnswers / totalPlays) * 100 : 0;

    // Buscar el primer premio
    const firstPrizePlay = plays?.find(play => 
      play.premio_ganado && 
      typeof play.premio_ganado === 'string' && 
      play.premio_ganado.trim() !== ''
    );
    const hasPrize = !!firstPrizePlay;
    const firstPrize = firstPrizePlay ? {
      prize: firstPrizePlay.premio_ganado as string,
      date: firstPrizePlay.created_at as string
    } : undefined;

    return {
      totalPlays,
      correctAnswers,
      incorrectAnswers,
      hasPrize,
      firstPrize,
      successRate: Math.round(successRate * 100) / 100 // Redondear a 2 decimales
    };
  } catch (error) {
    tvProdLogger.error('getParticipantStats: Error:', error);
    return {
      totalPlays: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      hasPrize: false,
      successRate: 0
    };
  }
} 