import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';

/**
 * Endpoint para cerrar una sesión de juego
 * CORREGIDO: Usa game_sessions en lugar de plays
 */
export async function POST(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      console.error('API /admin/sessions/close: supabaseAdmin no está disponible');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    const adminId = await getAuthenticatedAdminId();
    if (!adminId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    void adminId;

    // Parsear el cuerpo de la solicitud
    const { sessionId } = await request.json();

    // Validar que se proporcione el sessionId
    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID de sesión requerido' },
        { status: 400 }
      );
    }

    // CORREGIDO: Verificar que la sesión existe en game_sessions
    const { data: existingSession, error: checkError } = await supabaseAdmin
      .from('game_sessions')
      .select('id, session_id, status')
      .eq('session_id', sessionId)
      .single();

    if (checkError || !existingSession) {
      console.error('Error al verificar sesión:', checkError);
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la sesión no esté ya cerrada
    if (existingSession.status === 'completed' || existingSession.status === 'archived') {
      return NextResponse.json(
        { error: 'La sesión ya está cerrada' },
        { status: 400 }
      );
    }

    // CORREGIDO: Actualizar el estado en game_sessions a 'archived'
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('game_sessions')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error al cerrar sesión:', updateError);
      return NextResponse.json(
        { error: 'Error al cerrar la sesión' },
        { status: 500 }
      );
    }

    // También marcar como cerradas las jugadas relacionadas (si existen)
    const { error: playsUpdateError } = await supabaseAdmin
      .from('plays')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (playsUpdateError) {
      console.warn('Advertencia: Error al actualizar jugadas relacionadas:', playsUpdateError);
      // No fallar por esto, ya que las jugadas son opcionales
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
      session: updatedSession
    });

  } catch (error) {
    console.error('Error en endpoint de cierre de sesión:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 