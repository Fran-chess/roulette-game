import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Endpoint para actualizar el estado de una sesión de juego
export async function POST(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }
    
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

    // [modificación] Actualizar el estado de la sesión y timestamp en la tabla 'plays'
    const { data: updatedSession, error } = await supabaseAdmin
      .from('plays')
      .update({ status, updated_at: new Date().toISOString() }) // actualizar estado y timestamp [modificación]
      .eq('session_id', sessionId)
      .select() // devolver los campos actualizados [modificación]
      .single(); // asegurar un único registro [modificación]

    if (error) {
      console.error('Error al actualizar estado:', error);
      return NextResponse.json(
        { message: 'Error al actualizar estado de sesión' },
        { status: 500 }
      );
    }

    if (!updatedSession) { // [modificación] manejar caso de sesión no encontrada
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
      .maybeSingle(); // [modificación] Cambio de .single() a .maybeSingle() para evitar error 406 si la sesión fue eliminada

    if (fetchError) {
      console.error('Error al obtener detalles de sesión:', fetchError);
      // No interrumpimos: la actualización ya se realizó correctamente
    }

    return NextResponse.json({
      message: 'Estado de sesión actualizado exitosamente',
      session: sessionData || null
    });
  } catch (err: Error | unknown) {
    console.error('Error al actualizar estado de sesión:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
