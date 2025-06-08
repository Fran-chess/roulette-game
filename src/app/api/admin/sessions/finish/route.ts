import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';

/**
 * Endpoint para finalizar una sesión de juego
 * Marca la sesión como completada y finaliza todos los participantes activos
 */
export async function POST(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      console.error('API /admin/sessions/finish: supabaseAdmin no está disponible');
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

    console.log(`🏁 FINISH: Iniciando finalización de sesión ${sessionId}`);

    // Validar que se proporcione el sessionId
    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID de sesión requerido' },
        { status: 400 }
      );
    }

    // Verificar que la sesión existe en game_sessions
    const { data: existingSession, error: checkError } = await supabaseAdmin
      .from('game_sessions')
      .select('id, session_id, status')
      .eq('session_id', sessionId)
      .single();

    if (checkError || !existingSession) {
      console.error('❌ FINISH: Error al verificar sesión:', checkError);
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la sesión no esté ya finalizada
    if (existingSession.status === 'completed' || existingSession.status === 'archived') {
      console.log(`📱 FINISH: Sesión ${sessionId} ya está finalizada (${existingSession.status})`);
      return NextResponse.json(
        { error: 'La sesión ya está finalizada' },
        { status: 400 }
      );
    }

    console.log(`📱 FINISH: Sesión ${sessionId} encontrada, estado actual: ${existingSession.status}`);

    // Finalizar todos los participantes activos de la sesión
    const { error: participantsUpdateError } = await supabaseAdmin
      .from('participants')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .in('status', ['registered', 'playing']);

    if (participantsUpdateError) {
      console.error('❌ FINISH: Error al finalizar participantes:', participantsUpdateError);
      return NextResponse.json(
        { error: 'Error al finalizar participantes' },
        { status: 500 }
      );
    }

    console.log(`✅ FINISH: Participantes activos finalizados para sesión ${sessionId}`);

    // Actualizar el estado de la sesión en game_sessions
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('game_sessions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ FINISH: Error al finalizar sesión:', updateError);
      return NextResponse.json(
        { error: 'Error al finalizar la sesión' },
        { status: 500 }
      );
    }

    console.log(`✅ FINISH: Sesión ${sessionId} finalizada exitosamente`);

    // También marcar como completadas las jugadas relacionadas (si existen)
    const { error: playsUpdateError } = await supabaseAdmin
      .from('plays')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (playsUpdateError) {
      console.warn('⚠️ FINISH: Advertencia al actualizar jugadas relacionadas:', playsUpdateError);
      // No fallar por esto, ya que las jugadas son opcionales
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Sesión finalizada exitosamente',
      session: updatedSession
    });

  } catch (error) {
    console.error('❌ FINISH: Error en endpoint de finalización de sesión:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 