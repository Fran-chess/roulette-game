import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';
import { Participant } from '@/types';

/**
 * Endpoint para preparar la sesión para el siguiente participante
 * Marca el participante actual como completado y resetea la sesión para el próximo registro
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

    // Verificar autenticación del admin
    if (!(await getAuthenticatedAdminId())) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { sessionId, adminId } = await request.json();
    
    console.log('🔄 PREPARE-NEXT: Recibida solicitud para preparar siguiente participante:', { sessionId, adminId });

    // Validar campos obligatorios
    if (!sessionId) {
      return NextResponse.json(
        { message: 'ID de sesión es obligatorio' },
        { status: 400 }
      );
    }

    // Buscar la sesión en game_sessions
    const { data: existingSession, error: sessionError } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('❌ PREPARE-NEXT: Error al buscar sesión existente:', sessionError);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', error: sessionError.message },
        { status: 500 }
      );
    }

    if (!existingSession) {
      console.error('❌ PREPARE-NEXT: Sesión no encontrada:', sessionId);
      return NextResponse.json(
        { message: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    console.log('📱 PREPARE-NEXT: Sesión encontrada:', {
      sessionId: existingSession.session_id,
      status: existingSession.status,
      adminId: existingSession.admin_id
    });

    // Buscar el participante activo actual (registered o playing)
    const { data: currentParticipant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .in('status', ['registered', 'playing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (participantError) {
      console.error('❌ PREPARE-NEXT: Error al buscar participante actual:', participantError);
      return NextResponse.json(
        { message: 'Error al buscar participante actual', error: participantError.message },
        { status: 500 }
      );
    }

    // Si hay un participante activo, marcarlo como completado
    if (currentParticipant) {
      console.log('🔄 PREPARE-NEXT: Marcando participante actual como completado:', currentParticipant.id);
      
      const { error: updateParticipantError } = await supabaseAdmin
        .from('participants')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', (currentParticipant as unknown as Participant).id);

      if (updateParticipantError) {
        console.error('❌ PREPARE-NEXT: Error al marcar participante como completado:', updateParticipantError);
        return NextResponse.json(
          { message: 'Error al completar participante actual', error: updateParticipantError.message },
          { status: 500 }
        );
      }

      console.log('✅ PREPARE-NEXT: Participante marcado como completado:', (currentParticipant as unknown as Participant).nombre);
    }

    // Resetear la sesión a estado pending_player_registration
    console.log('🔄 PREPARE-NEXT: Reseteando sesión para siguiente participante...');
    console.log('🔄 PREPARE-NEXT: Estado anterior:', existingSession.status, '→ pending_player_registration');

    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('game_sessions')
      .update({
        status: 'pending_player_registration',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ PREPARE-NEXT: Error al resetear sesión para siguiente participante:', updateError);
      return NextResponse.json(
        { message: 'Error al preparar sesión para siguiente participante', error: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ PREPARE-NEXT: Sesión preparada exitosamente para siguiente participante');
    console.log('✅ PREPARE-NEXT: Estado actualizado a:', updatedSession.status);

    // Verificación adicional para asegurar que el cambio se propagó
    console.log('🔍 PREPARE-NEXT: Verificando que el cambio se aplicó correctamente en la base de datos...');
    const { data: verificationData, error: verificationError } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (verificationError) {
      console.warn('⚠️ PREPARE-NEXT: Error en verificación post-reset:', verificationError);
    } else {
      console.log('✅ PREPARE-NEXT: Verificación exitosa - Estado actual en DB:', verificationData.status);
      console.log('✅ PREPARE-NEXT: Admin ID en DB:', verificationData.admin_id);
      console.log('✅ PREPARE-NEXT: Timestamp updated_at:', verificationData.updated_at);
      
      if (verificationData.status === 'pending_player_registration') {
        console.log('🎯 PREPARE-NEXT: ¡Sesión preparada! La TV debería volver a WaitingScreen automáticamente via realtime');
        console.log('🎯 PREPARE-NEXT: Listo para registrar próximo participante');
      }
    }

    return NextResponse.json({
      message: 'Sesión preparada exitosamente para siguiente participante',
      session: updatedSession,
      completed_participant: currentParticipant,
      ready_for_next: true
    });

  } catch (err: Error | unknown) {
    console.error('❌ PREPARE-NEXT: Error en preparación para siguiente participante:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 