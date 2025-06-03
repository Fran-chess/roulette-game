import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Endpoint para preparar la sesión para el siguiente participante
// Resetea los datos del participante actual pero mantiene la sesión activa
export async function POST(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }

    // [modificación] Comentar temporalmente la verificación de admin para permitir llamadas desde TV/juego
    // if (!(await getAuthenticatedAdminId())) {
    //   return NextResponse.json(
    //     { message: 'No autorizado' },
    //     { status: 401 }
    //   );
    // }
    
    const { sessionId, adminId } = await request.json();
    
    console.log('🔄 PREPARE-NEXT: Recibida solicitud para preparar siguiente participante:', { sessionId, adminId });

    // Validar campos obligatorios
    if (!sessionId) {
      return NextResponse.json(
        { message: 'ID de sesión es obligatorio' },
        { status: 400 }
      );
    }

    // [modificación] Buscar la sesión existente
    const { data: existingSession, error: sessionError } = await supabaseAdmin
      .from('plays')
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
      participante: existingSession.nombre || 'N/A',
      adminId: existingSession.admin_id
    });

    // [modificación] Datos para resetear participante pero mantener sesión
    const resetData = {
      nombre: 'Pendiente',
      apellido: null,
      email: 'pendiente@registro.com',
      especialidad: null,
      participant_id: null,
      status: 'pending_player_registration',
      // [modificación] CRUCIAL: Mantener el admin_id original de la sesión
      admin_id: existingSession.admin_id,
      // [modificación] Limpiar datos de juego pero mantener estructura de sesión
      answeredcorrectly: null,
      lastquestionid: null,
      score: null,
      premio_ganado: null,
      detalles_juego: null,
      updated_at: new Date().toISOString()
    };

    console.log('🔄 PREPARE-NEXT: Reseteando participante actual y preparando para siguiente jugador...');
    console.log('🔄 PREPARE-NEXT: Estado anterior:', existingSession.status, '→ pending_player_registration');
    console.log('🔄 PREPARE-NEXT: Participante anterior:', existingSession.nombre, '→ Pendiente');
    console.log('🔄 PREPARE-NEXT: Admin ID preservado:', existingSession.admin_id);

    // [modificación] Hacer UPDATE para resetear participante
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('plays')
      .update(resetData)
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
    console.log('✅ PREPARE-NEXT: Esto debería enviar evento UPDATE a la TV con estado: pending_player_registration');

    // [modificación] Verificación adicional para asegurar que el cambio se propagó
    console.log('🔍 PREPARE-NEXT: Verificando que el cambio se aplicó correctamente en la base de datos...');
    const { data: verificationData, error: verificationError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (verificationError) {
      console.warn('⚠️ PREPARE-NEXT: Error en verificación post-reset:', verificationError);
    } else {
      console.log('✅ PREPARE-NEXT: Verificación exitosa - Estado actual en DB:', verificationData.status);
      console.log('✅ PREPARE-NEXT: Participante en DB:', verificationData.nombre);
      console.log('✅ PREPARE-NEXT: Admin ID en DB:', verificationData.admin_id);
      console.log('✅ PREPARE-NEXT: Timestamp updated_at:', verificationData.updated_at);
      
      // [modificación] Notificación específica para la TV
      if (verificationData.status === 'pending_player_registration') {
        console.log('🎯 PREPARE-NEXT: ¡Sesión preparada! La TV debería volver a WaitingScreen automáticamente via realtime');
        console.log('🎯 PREPARE-NEXT: Evento realtime enviado con admin_id:', verificationData.admin_id);
        console.log('🎯 PREPARE-NEXT: Listo para registrar próximo participante');
      }
    }

    return NextResponse.json({
      message: 'Sesión preparada exitosamente para siguiente participante',
      session: updatedSession,
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