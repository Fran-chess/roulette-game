import { NextResponse } from 'next/server';
import { getParticipantStats, hasParticipantWonPrize } from '@/utils/gameUtils';

/**
 * Endpoint para obtener estadísticas de un participante
 * GET /api/participants/stats?participantId=xxx
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json(
        { message: 'participantId es requerido' },
        { status: 400 }
      );
    }

    console.log('📊 PARTICIPANT-STATS: Obteniendo estadísticas para participante:', participantId);

    // Obtener estadísticas completas
    const stats = await getParticipantStats(participantId);

    console.log('📊 PARTICIPANT-STATS: Estadísticas obtenidas:', {
      totalPlays: stats.totalPlays,
      hasPrize: stats.hasPrize,
      successRate: stats.successRate
    });

    return NextResponse.json({
      success: true,
      participantId,
      stats
    });

  } catch (error) {
    console.error('❌ PARTICIPANT-STATS: Error:', error);
    return NextResponse.json(
      { 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint simple para verificar si un participante ya ganó un premio
 * POST /api/participants/stats con { participantId, action: 'check-prize' }
 */
export async function POST(request: Request) {
  try {
    const { participantId, action } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { message: 'participantId es requerido' },
        { status: 400 }
      );
    }

    if (action === 'check-prize') {
      console.log('🏆 PARTICIPANT-STATS: Verificando premio para participante:', participantId);
      
      const hasWon = await hasParticipantWonPrize(participantId);
      
      console.log('🏆 PARTICIPANT-STATS: Resultado:', hasWon ? 'Ya ganó premio' : 'Elegible para premio');

      return NextResponse.json({
        success: true,
        participantId,
        hasWonPrize: hasWon
      });
    }

    return NextResponse.json(
      { message: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ PARTICIPANT-STATS: Error en POST:', error);
    return NextResponse.json(
      { 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 