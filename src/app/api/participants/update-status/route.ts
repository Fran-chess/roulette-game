import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { tvProdLogger } from '@/utils/tvLogger';

// POST: Actualizar estado de participante (endpoint público para el juego)
export async function POST(request: NextRequest) {
  try {
    const { participantId, status } = await request.json();

    if (!participantId || !status) {
      return NextResponse.json(
        { error: 'participantId y status son requeridos' },
        { status: 400 }
      );
    }

    // Validar estado - solo permitir transiciones de juego
    const validStatuses = ['playing', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado no válido para endpoint público' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Actualizar estado del participante
    const { data, error } = await supabaseAdmin
      .from('participants')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'playing' && { started_playing_at: new Date().toISOString() }),
        ...(status === 'completed' && { completed_at: new Date().toISOString() })
      })
      .eq('id', participantId)
      .select()
      .single();

    if (error) {
      tvProdLogger.error('Error al actualizar estado del participante:', error);
      return NextResponse.json(
        { error: 'Error al actualizar estado del participante' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Estado actualizado exitosamente',
      participant: data
    });

  } catch (error) {
    tvProdLogger.error('Error en POST /api/participants/update-status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}