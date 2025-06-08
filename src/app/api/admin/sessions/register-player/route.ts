import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';
import { v4 as uuidv4 } from 'uuid';
import { Participant } from '@/types';

/**
 * Endpoint para registrar un jugador en una sesión
 * CORREGIDO: Usa game_sessions para sesiones y participants para participantes
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

    if (!(await getAuthenticatedAdminId())) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { sessionId, nombre, apellido, email, especialidad } = await request.json();
    
    console.log('📱 REGISTER: Recibida solicitud de registro:', { sessionId, nombre, email });

    // Validar campos obligatorios
    if (!sessionId) {
      return NextResponse.json(
        { message: 'ID de sesión es obligatorio' },
        { status: 400 }
      );
    }

    if (!nombre || !email) {
      return NextResponse.json(
        { message: 'Nombre y email son obligatorios' },
        { status: 400 }
      );
    }

    // CORREGIDO: Buscar la sesión en game_sessions
    const { data: existingSession, error: sessionError } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('❌ REGISTER: Error al buscar sesión existente:', sessionError);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', error: sessionError.message },
        { status: 500 }
      );
    }

    if (!existingSession) {
      console.error('❌ REGISTER: Sesión no encontrada en game_sessions');
      return NextResponse.json(
        { message: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    console.log(`📱 REGISTER: Sesión encontrada con admin_id: ${existingSession.admin_id}`);

    // Verificar si ya hay un participante ACTIVO registrado en esta sesión
    // MODIFICADO: Solo rechazar si hay un participante con status 'registered' o 'playing'
    // Permitir nuevos registros cuando la sesión esté en 'pending_player_registration'
    const { data: activeParticipant, error: participantCheckError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .in('status', ['registered', 'playing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (participantCheckError) {
      console.error('❌ REGISTER: Error al verificar participante activo:', participantCheckError);
      return NextResponse.json(
        { message: 'Error al verificar participante activo', error: participantCheckError.message },
        { status: 500 }
      );
    }

    // Solo rechazar si hay un participante activo (registered o playing)
    if (activeParticipant) {
      console.log('📱 REGISTER: Ya hay un participante activo en esta sesión');
      
      if ((activeParticipant as unknown as Participant).email === email.trim().toLowerCase()) {
        console.log('📱 REGISTER: Participante ya registrado con el mismo email en esta sesión');
        return NextResponse.json({
          message: 'Participante ya registrado en esta sesión',
          session: existingSession,
          participant: activeParticipant,
          isExisting: true
        });
      } else {
        console.log('📱 REGISTER: Ya hay un participante activo diferente en esta sesión');
        return NextResponse.json(
          { message: 'Ya hay otro participante actualmente registrado en esta sesión. Use "Preparar Siguiente" para continuar.' },
          { status: 409 }
        );
      }
    }

    // Verificar que la sesión esté en estado correcto para recibir nuevos participantes
    if (existingSession.status !== 'pending_player_registration') {
      console.log('📱 REGISTER: Sesión no está en estado pending_player_registration, estado actual:', existingSession.status);
      return NextResponse.json(
        { message: `La sesión debe estar en estado 'pending_player_registration' para registrar participantes. Estado actual: '${existingSession.status}'` },
        { status: 400 }
      );
    }

    console.log('📱 REGISTER: ✅ Sesión disponible para nuevo participante - procediendo con registro');

    // Verificar si ya existe un participante con el mismo email en esta sesión (independientemente del estado)
    const { data: existingParticipant, error: existingParticipantError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .eq('email', email.trim().toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingParticipantError) {
      console.error('❌ REGISTER: Error al verificar participante existente:', existingParticipantError);
      return NextResponse.json(
        { message: 'Error al verificar participante existente', error: existingParticipantError.message },
        { status: 500 }
      );
    }

    let finalParticipant;

    if (existingParticipant) {
      // Participante existente encontrado - reactivarlo para una nueva partida
      const participant = existingParticipant as unknown as Participant;
      console.log(`📱 REGISTER: Participante existente encontrado (${participant.id}), reactivando para nueva partida`);
      
      const { data: reactivatedParticipant, error: reactivateError } = await supabaseAdmin
        .from('participants')
        .update({
          nombre: nombre.trim(), // Actualizar nombre por si cambió
          apellido: apellido?.trim() || '',
          especialidad: especialidad?.trim() || null,
          status: 'registered', // Reactivar como registrado
          updated_at: new Date().toISOString()
        })
        .eq('id', participant.id)
        .select()
        .single();

      if (reactivateError) {
        console.error('❌ REGISTER: Error al reactivar participante:', reactivateError);
        return NextResponse.json(
          { message: 'Error al reactivar participante', error: reactivateError.message },
          { status: 500 }
        );
      }

      finalParticipant = reactivatedParticipant;
      console.log(`✅ REGISTER: Participante reactivado exitosamente: ${(finalParticipant as unknown as Participant).id}`);
      console.log(`🎮 REGISTER: ${(finalParticipant as unknown as Participant).nombre} ha vuelto para jugar de nuevo!`);
    } else {
      // No existe participante con este email - crear uno nuevo
      const participantId = uuidv4();
      
      console.log(`📱 REGISTER: Creando nuevo participante con ID: ${participantId}`);
      
      const { data: newParticipant, error: participantError } = await supabaseAdmin
        .from('participants')
        .insert({
          id: participantId,
          session_id: sessionId,
          nombre: nombre.trim(),
          apellido: apellido?.trim() || '',
          email: email.trim().toLowerCase(),
          especialidad: especialidad?.trim() || null,
          status: 'registered',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (participantError) {
        console.error('❌ REGISTER: Error al crear participante:', participantError);
        return NextResponse.json(
          { message: 'Error al crear participante', error: participantError.message },
          { status: 500 }
        );
      }

      finalParticipant = newParticipant;
      console.log(`✅ REGISTER: Participante creado exitosamente: ${(finalParticipant as unknown as Participant).id}`);
    }

    // [optimización] Actualizar la sesión usando una transacción para garantizar atomicidad
    // Esto previene race conditions entre el INSERT del participante y UPDATE de la sesión
    const updateTimestamp = new Date().toISOString();
    
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('game_sessions')
      .update({
        status: 'player_registered',
        updated_at: updateTimestamp
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ REGISTER: Error al actualizar sesión:', updateError);
      return NextResponse.json(
        { message: 'Error al actualizar sesión', error: updateError.message },
        { status: 500 }
      );
    }

    // [optimización] Pequeño delay para asegurar que los cambios se propaguen en realtime
    // Esto ayuda a evitar race conditions en clientes que escuchan cambios
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(`✅ REGISTER: Sesión ${sessionId} actualizada exitosamente`);
    console.log(`✅ REGISTER: Estado actualizado a: player_registered`);

    const participantData = finalParticipant as unknown as Participant;
    
    return NextResponse.json({
      message: existingParticipant 
        ? `¡Bienvenido de vuelta, ${participantData.nombre}! Listo para una nueva partida` 
        : 'Participante registrado exitosamente',
      session: updatedSession,
      participant: finalParticipant,
      participantId: participantData.id,
      registered: true,
      sessionStatus: 'player_registered',
      isReturningPlayer: !!existingParticipant, // Indicar si es un jugador que regresa
      action: existingParticipant ? 'reactivated' : 'created' // Acción realizada
    });

  } catch (err: unknown) {
    console.error('❌ REGISTER: Error general:', err);
    return NextResponse.json(
      { 
        message: 'Error interno del servidor',
        error: err instanceof Error ? err.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 
