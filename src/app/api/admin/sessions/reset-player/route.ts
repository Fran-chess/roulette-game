import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isPlayerRegistered } from '@/utils/session';

/**
 * API endpoint para resetear los datos de un jugador en una sesión
 * Esto permite que un nuevo jugador se registre en la misma sesión
 */
export async function POST(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }
    
    const { sessionId, adminId } = await request.json();
    
    // Validar campos obligatorios
    if (!sessionId) {
      return NextResponse.json(
        { message: 'ID de sesión es obligatorio' },
        { status: 400 }
      );
    }

    console.log(`Reseteando datos de jugador para sesión: ${sessionId}`);
    
    // Verificar primero si la sesión existe
    const { data: sessionData, error: sessionFetchError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
      
    if (sessionFetchError) {
      console.error('Error al buscar la sesión:', sessionFetchError);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', error: sessionFetchError.message },
        { status: 500 }
      );
    }
    
    if (!sessionData) {
      return NextResponse.json(
        { message: 'Sesión no encontrada. Verifica el ID de la sesión.' },
        { status: 404 }
      );
    }
    
    // Verificar si hay un jugador registrado (solo para información)
    if (isPlayerRegistered(sessionData)) {
      console.log(`Reseteando jugador: ${sessionData.nombre} (${sessionData.email})`);
    } else {
      console.log(`La sesión no tenía un jugador registrado (estado: ${sessionData.status})`);
    }
    
    // Datos a actualizar - resetear campos del jugador y cambiar estado
    const updateData = {
      nombre: null,
      apellido: null,
      email: null,
      especialidad: null,
      participant_id: null,
      lastquestionid: null,
      answeredcorrectly: null,
      score: null,
      premio_ganado: null,
      detalles_juego: null,
      status: 'pending_player_registration',
      updated_at: new Date().toISOString(),
      // Si se proporcionó el adminId, actualizarlo
      ...(adminId ? { 
        admin_id: adminId,
        admin_updated_at: new Date().toISOString() 
      } : {})
    };
    
    // Actualizar la sesión para resetear los datos del jugador
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('plays')
      .update(updateData)
      .eq('session_id', sessionId)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error al resetear los datos del jugador:', updateError);
      return NextResponse.json(
        { message: 'Error al resetear los datos del jugador', error: updateError.message },
        { status: 500 }
      );
    }
    
    // Si no hay sesión actualizada (raro, pero posible)
    if (!updatedSession) {
      return NextResponse.json(
        { message: 'No se pudo resetear la sesión. La sesión podría haber sido eliminada.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Datos del jugador reseteados exitosamente',
      session: updatedSession
    });
  } catch (err: Error | unknown) {
    console.error('Error al resetear los datos del jugador:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 