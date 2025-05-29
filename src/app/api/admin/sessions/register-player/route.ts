import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Endpoint para registrar un jugador en una sesión
export async function POST(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }
    
    const { sessionId, nombre, apellido, email, especialidad } = await request.json();
    
    // Información de depuración
    console.log('Recibida solicitud de registro:', { sessionId, nombre, email });

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

    // Buscar TODOS los registros existentes para esta sesión
    const { data: existingRecords, error: checkError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (checkError) {
      console.error('Error al verificar registros existentes:', checkError);
      return NextResponse.json(
        { message: 'Error al verificar registros existentes', error: checkError.message },
        { status: 500 }
      );
    }

    // Si existen registros, verificar si alguno tiene el mismo email
    if (existingRecords && existingRecords.length > 0) {
      const sameEmailRecord = existingRecords.find(record => record.email === email);
      
      if (sameEmailRecord && sameEmailRecord.status === 'player_registered') {
        console.log('Participante ya registrado con el mismo email en esta sesión');
        return NextResponse.json({
          message: 'Participante ya registrado en esta sesión',
          session: sameEmailRecord,
          isExisting: true
        });
      }
      
      // Eliminar TODOS los registros existentes antes de crear el nuevo
      console.log(`Eliminando ${existingRecords.length} registros existentes para la sesión ${sessionId}`);
      const { error: deleteError } = await supabaseAdmin
        .from('plays')
        .delete()
        .eq('session_id', sessionId);

      if (deleteError) {
        console.error('Error al eliminar registros existentes:', deleteError);
        return NextResponse.json(
          { message: 'Error al limpiar registros existentes', error: deleteError.message },
          { status: 500 }
        );
      }
      
      console.log(`Registros existentes eliminados para la sesión ${sessionId}`);
    }

    // Obtener adminId del primer registro existente si estaba disponible
    const adminId = existingRecords && existingRecords.length > 0 
      ? existingRecords[0].admin_id 
      : 'auto_created';

    // Crear un ID único para el participante
    const participantId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Crear un nuevo registro limpio para este participante
    const newParticipantData = {
      session_id: sessionId,
      nombre,
      apellido: apellido || null,
      email,
      especialidad: especialidad || null,
      participant_id: participantId,
      status: 'player_registered',
      admin_id: adminId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Creando nuevo registro de participante:', newParticipantData);

    // Insertar el nuevo registro único
    const { data: newSession, error: insertError } = await supabaseAdmin
      .from('plays')
      .insert(newParticipantData)
      .select()
      .single();

    if (insertError) {
      console.error('Error al registrar nuevo participante:', insertError);
      return NextResponse.json(
        { message: 'Error al registrar participante en la sesión', error: insertError.message },
        { status: 500 }
      );
    }

    // Actualizar inmediatamente el estado a 'playing' para que la TV cambie de vista
    console.log(`Actualizando estado de sesión ${sessionId} a 'playing'`);
    
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('plays')
      .update({ 
        status: 'playing',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error al actualizar estado a playing:', updateError);
      // No fallar por completo, devolver la sesión registrada
      console.log(`Participante ${nombre} registrado exitosamente en la sesión ${sessionId} (estado: player_registered)`);
      
      return NextResponse.json({
        message: 'Participante registrado exitosamente (advertencia: no se pudo actualizar estado a playing)',
        session: newSession,
        isNew: true,
        warning: 'Estado no actualizado automáticamente'
      });
    }

    console.log(`Participante ${nombre} registrado exitosamente en la sesión ${sessionId} y estado actualizado a 'playing'`);

    return NextResponse.json({
      message: 'Participante registrado exitosamente y juego iniciado',
      session: updatedSession || newSession,
      isNew: true
    });

  } catch (err: Error | unknown) {
    console.error('Error en el registro de participante:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 