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

    console.log(`📊 API-PARTICIPANTS: Encontrados ${participantsList.length} participantes únicos de ${allParticipants?.length || 0} registros totales`);

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