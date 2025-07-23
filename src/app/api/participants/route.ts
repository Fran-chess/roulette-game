import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }
    
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail'); // Si se pasa 'detail=true', devuelve lista completa

    // CORREGIDO: Obtener TODOS los participantes registrados, no solo los que tienen jugadas
    // Eliminamos el inner join con plays para mostrar todos los participantes
    const { data: allParticipants, error: participantsError } = await supabaseAdmin
      .from('participants')
      .select(`
        id,
        nombre,
        apellido,
        email,
        especialidad,
        created_at,
        session_id,
        status
      `)
      .not('email', 'is', null) // Solo participantes con email
      .order('created_at', { ascending: false }); // Más recientes primero

    if (participantsError) {
      console.error('Error al obtener participantes:', participantsError);
      return NextResponse.json(
        { message: 'Error al obtener participantes.', details: participantsError.message },
        { status: 500 }
      );
    }

    // Filtrar participantes únicos por email (eliminando duplicados)
    // Un mismo email puede haber participado en múltiples sesiones
    const uniqueEmailMap = new Map();
    const participantsList = [];
    
    for (const participant of allParticipants || []) {
      if (participant.email && !uniqueEmailMap.has(participant.email)) {
        uniqueEmailMap.set(participant.email, true);
        participantsList.push({
          id: participant.id,
          nombre: participant.nombre,
          apellido: participant.apellido || '',
          email: participant.email,
          especialidad: participant.especialidad || '',
          created_at: participant.created_at,
          session_id: participant.session_id,
          status: participant.status
        });
      }
    }

    // [PROD] Log removido para optimización en producción

    // Si solo se pide el conteo
    if (detail !== 'true') {
      return NextResponse.json({
        count: participantsList.length,
        message: `Total de ${participantsList.length} participantes únicos registrados`
      });
    }

    // Si se pide el detalle completo, devolver la lista
    return NextResponse.json({
      count: participantsList.length,
      participants: participantsList,
      message: `Lista completa de ${participantsList.length} participantes únicos registrados`
    });

  } catch (err: Error | unknown) {
    console.error('Error del servidor en participants:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', details: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { nombre, apellido, email, especialidad, session_id } = body;
    
    // Validación de campos requeridos
    if (!nombre || !email || !session_id) {
      return NextResponse.json(
        { message: 'Nombre, email y session_id son campos requeridos' },
        { status: 400 }
      );
    }
    
    // Verificar si la sesión existe
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('game_sessions')
      .select('id, session_id, status')
      .eq('session_id', session_id)
      .single();
    
    // [PROD] Debug log removido para producción
    
    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'La sesión especificada no existe' },
        { status: 404 }
      );
    }
    
    // Verificar si la sesión está disponible para registro
    if (session.status !== 'active' && session.status !== 'pending_player_registration') {
      return NextResponse.json(
        { message: 'La sesión no está disponible para registro' },
        { status: 400 }
      );
    }
    
    // Verificar si el participante ya existe en esta sesión
    const { data: existingParticipant } = await supabaseAdmin
      .from('participants')
      .select('id, email')
      .eq('email', email)
      .eq('session_id', session_id)
      .single();
    
    if (existingParticipant) {
      return NextResponse.json(
        { message: 'Este email ya está registrado en esta sesión' },
        { status: 409 }
      );
    }
    
    // Crear nuevo participante
    const participantData = {
      nombre,
      apellido: apellido || '',
      email,
      especialidad: especialidad || '',
      session_id: session_id, // Use the session string ID if FK references session_id field
      status: 'registered',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newParticipant, error: insertError } = await supabaseAdmin
      .from('participants')
      .insert([participantData])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error al insertar participante:', insertError);
      return NextResponse.json(
        { message: 'Error al registrar participante', details: insertError.message },
        { status: 500 }
      );
    }
    
    // [PROD] Log de registro exitoso removido
    
    return NextResponse.json({
      message: 'Participante registrado exitosamente',
      participant: newParticipant
    }, { status: 201 });
    
  } catch (err: Error | unknown) {
    console.error('Error del servidor en participants POST:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', details: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { id, status, completed_at } = body;
    
    if (!id) {
      return NextResponse.json(
        { message: 'ID de participante es requerido' },
        { status: 400 }
      );
    }
    
    // Preparar los datos a actualizar
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (status) {
      updateData.status = status;
    }
    
    if (completed_at) {
      updateData.completed_at = completed_at;
    }
    
    // Actualizar participante en la base de datos
    const { data, error } = await supabaseAdmin
      .from('participants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error al actualizar participante:', error);
      return NextResponse.json(
        { message: 'Error al actualizar participante', details: error.message },
        { status: 500 }
      );
    }
    
    // [PROD] Log de actualización removido
    
    return NextResponse.json({
      message: 'Participante actualizado exitosamente',
      participant: data
    });
    
  } catch (err: Error | unknown) {
    console.error('Error del servidor en participants PUT:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', details: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 