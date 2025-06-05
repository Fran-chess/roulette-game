import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';

/**
 * Endpoint para actualizar el estado de una sesión de juego
 * CORREGIDO: Ahora usa game_sessions en lugar de plays
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

    const adminId = await getAuthenticatedAdminId();
    if (!adminId) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    void adminId;

    const { sessionId, status } = await request.json();

    console.log(`🔄 API Update-Status: Iniciando actualización de estado`);
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Nuevo estado: ${status}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Validar campos obligatorios
    if (!sessionId || !status) {
      console.error(`❌ API Update-Status: Campos faltantes - sessionId: ${sessionId}, status: ${status}`);
      return NextResponse.json(
        { message: 'ID de sesión y estado son obligatorios' },
        { status: 400 }
      );
    }

    // Validar que el estado es válido
    const validStatuses = ['pending_player_registration', 'player_registered', 'playing', 'completed'];
    if (!validStatuses.includes(status)) {
      console.error(`❌ API Update-Status: Estado inválido '${status}'. Válidos: ${validStatuses.join(', ')}`);
      return NextResponse.json(
        { message: 'Estado no válido' },
        { status: 400 }
      );
    }

    // CORREGIDO: Verificar que la sesión existe en game_sessions
    console.log(`🔍 API Update-Status: Verificando existencia de sesión ${sessionId}...`);
    const { data: existingSession, error: existingError } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error(`❌ API Update-Status: Error verificando sesión existente:`, existingError);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', error: existingError.message },
        { status: 500 }
      );
    }

    if (!existingSession) {
      console.error(`❌ API Update-Status: Sesión ${sessionId} no encontrada en la base de datos`);
      return NextResponse.json(
        { message: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    console.log(`✅ API Update-Status: Sesión encontrada`);
    console.log(`   ID interno: ${existingSession.id}`);
    console.log(`   Estado actual: ${existingSession.status}`);
    console.log(`   Admin ID: ${existingSession.admin_id}`);

    // CORREGIDO: Actualizar el estado en game_sessions
    console.log(`🔄 API Update-Status: Ejecutando UPDATE en la base de datos...`);
    const updateTimestamp = new Date().toISOString();
    
    const { data: updatedSession, error } = await supabaseAdmin
      .from('game_sessions')
      .update({ 
        status, 
        updated_at: updateTimestamp 
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error(`❌ API Update-Status: Error actualizando sesión:`, error);
      return NextResponse.json(
        { message: 'Error al actualizar la sesión', error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ API Update-Status: Sesión actualizada exitosamente`);
    console.log(`   Nuevo estado: ${updatedSession.status}`);
    console.log(`   Timestamp actualizado: ${updatedSession.updated_at}`);

    return NextResponse.json({
      message: 'Estado de sesión actualizado exitosamente',
      session: updatedSession,
      previousStatus: existingSession.status,
      newStatus: status,
    });
  } catch (err: unknown) {
    console.error(`❌ API Update-Status: Error general:`, err);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
