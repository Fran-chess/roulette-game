import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';

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

    const adminId = await getAuthenticatedAdminId();
    if (!adminId) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    void adminId;

    const { sessionId, status } = await request.json();

    // [modificación] Logs detallados para debugging
// //     console.log(`🔄 API Update-Status: Iniciando actualización de estado`);
// //     console.log(`   Session ID: ${sessionId}`);
// //     console.log(`   Nuevo estado: ${status}`);
// //     console.log(`   Timestamp: ${new Date().toISOString()}`);

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

    // [modificación] Verificar que la sesión existe antes de actualizar
// //     console.log(`🔍 API Update-Status: Verificando existencia de sesión ${sessionId}...`);
    const { data: existingSession, error: existingError } = await supabaseAdmin
      .from('plays')
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

// //     console.log(`✅ API Update-Status: Sesión encontrada`);
// //     console.log(`   ID interno: ${existingSession.id}`);
// //     console.log(`   Estado actual: ${existingSession.status}`);
// //     console.log(`   Admin ID: ${existingSession.admin_id}`);
// //     console.log(`   Jugador: ${existingSession.nombre || 'N/A'} (${existingSession.email || 'N/A'})`);

    // [modificación] Actualizar el estado de la sesión y timestamp en la tabla 'plays'
// //     console.log(`🔄 API Update-Status: Ejecutando UPDATE en la base de datos...`);
    const updateTimestamp = new Date().toISOString();
    
    const { data: updatedSession, error } = await supabaseAdmin
      .from('plays')
      .update({ 
        status, 
        updated_at: updateTimestamp 
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error(`❌ API Update-Status: Error en UPDATE:`, error);
      return NextResponse.json(
        { message: 'Error al actualizar estado de sesión', error: error.message },
        { status: 500 }
      );
    }

    if (!updatedSession) {
      console.error(`❌ API Update-Status: UPDATE ejecutado pero no se retornó ningún registro`);
      return NextResponse.json(
        { message: 'No se encontró la sesión o no se pudo actualizar' },
        { status: 404 }
      );
    }

// //     console.log(`✅ API Update-Status: UPDATE exitoso`);
// //     console.log(`   Registro ID: ${updatedSession.id}`);
// //     console.log(`   Nuevo estado: ${updatedSession.status}`);
// //     console.log(`   Timestamp actualizado: ${updatedSession.updated_at}`);
// //     console.log(`   Admin ID: ${updatedSession.admin_id}`);

    // [modificación] Verificar que la actualización se reflejó correctamente
// //     console.log(`🔍 API Update-Status: Verificando que la actualización se aplicó correctamente...`);
    const { data: verificationSession, error: verificationError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    // Prevent unused variable lint error when logging is disabled
    void verificationSession;

    if (verificationError) {
      console.warn(`⚠️ API Update-Status: Error en verificación post-update:`, verificationError);
    } else {
// //       console.log(`✅ API Update-Status: Verificación exitosa - Estado actual en DB: ${verificationSession.status}`);
    }

// //     console.log(`🎯 API Update-Status: Operación completada exitosamente para sesión ${sessionId}`);

    return NextResponse.json({
      message: 'Estado de sesión actualizado exitosamente',
      session: updatedSession,
      previousStatus: existingSession.status,
      newStatus: status,
      updateTimestamp
    });
  } catch (err: Error | unknown) {
    console.error('❌ API Update-Status: Error interno del servidor:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
