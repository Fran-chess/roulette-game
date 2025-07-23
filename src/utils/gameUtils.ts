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

    // Optimización SQL: usar función RPC con EXISTS para mejor performance
    const { data: hasWon, error } = await supabaseAdmin
      .rpc('has_participant_won_prize', { participant_id_param: participantId });

    if (error) {
      tvProdLogger.error('hasParticipantWonPrize: Error consultando premios:', error);
      return false;
    }

    return Boolean(hasWon);
  } catch (error) {
    tvProdLogger.error('hasParticipantWonPrize: Error:', error);
    return false;
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

    // Optimización SQL: usar función RPC que calcula todo en la base de datos
    const { data: stats, error: statsError } = await supabaseAdmin
      .rpc('get_participant_stats', { participant_id_param: participantId });

    if (statsError) {
      tvProdLogger.error('getParticipantStats: Error obteniendo estadísticas:', statsError);
      return {
        totalPlays: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        hasPrize: false,
        successRate: 0
      };
    }

    // Los datos ya vienen calculados desde SQL
    const statsArray = Array.isArray(stats) ? stats : [];
    const result = statsArray[0];
    if (!result) {
      return {
        totalPlays: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        hasPrize: false,
        successRate: 0
      };
    }

    const firstPrize = result.has_prize && result.first_prize_name ? {
      prize: result.first_prize_name,
      date: result.first_prize_date
    } : undefined;

    return {
      totalPlays: Number(result.total_plays) || 0,
      correctAnswers: Number(result.correct_answers) || 0,
      incorrectAnswers: Number(result.incorrect_answers) || 0,
      hasPrize: result.has_prize || false,
      firstPrize,
      successRate: Number(result.success_rate) || 0
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