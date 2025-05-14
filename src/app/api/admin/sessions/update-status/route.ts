import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Endpoint para actualizar el estado de una sesión de juego
export async function POST(request: Request) {
  try {
    const { sessionId, status } = await request.json();

    // Validar campos obligatorios
    if (!sessionId || !status) {
      return NextResponse.json(
        { message: 'ID de sesión y estado son obligatorios' },
        { status: 400 }
      );
    }

    // Validar que el estado es válido
    const validStatuses = ['pending_player_registration', 'player_registered', 'playing', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Estado no válido' },
        { status: 400 }
      );
    }

    // Actualizar estado de la sesión usando la función de PostgreSQL
    const { data: updated, error } = await supabaseAdmin.rpc(
      'update_game_session_status',
      {
        p_session_id: sessionId,
        p_status: status
      }
    );

    if (error) {
      console.error('Error al actualizar estado:', error);
      return NextResponse.json(
        { message: 'Error al actualizar estado de sesión' },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json(
        { message: 'No se encontró la sesión o no se pudo actualizar' },
        { status: 404 }
      );
    }

    // Obtener los detalles actualizados de la sesión
    const { data: sessionData, error: fetchError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (fetchError) {
      console.error('Error al obtener detalles de sesión:', fetchError);
      // No devolvemos error, ya que la sesión se actualizó correctamente
    }

    return NextResponse.json({
      message: 'Estado de sesión actualizado exitosamente',
      session: sessionData || null
    });
  } catch (err: any) {
    console.error('Error al actualizar estado de sesión:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 