import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // [modificación] Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }
    
    // [modificación] Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail'); // Si se pasa 'detail=true', devuelve lista completa

    // [modificación] Obtener participantes únicos basados en email desde plays
    const { data: uniqueParticipants, error: participantsError } = await supabaseAdmin
      .from('plays')
      .select('nombre, apellido, email, especialidad, created_at')
      .not('email', 'is', null)
      .order('created_at');

    if (participantsError) {
      console.error('Error al obtener participantes:', participantsError);
      return NextResponse.json(
        { message: 'Error al obtener participantes.', details: participantsError.message },
        { status: 500 }
      );
    }

    // [modificación] Filtrar participantes únicos por email
    const uniqueEmailMap = new Map();
    const participantsList = [];
    
    for (const participant of uniqueParticipants || []) {
      if (participant.email && !uniqueEmailMap.has(participant.email)) {
        uniqueEmailMap.set(participant.email, true);
        participantsList.push({
          nombre: participant.nombre,
          apellido: participant.apellido || '',
          email: participant.email,
          especialidad: participant.especialidad || '',
          created_at: participant.created_at
        });
      }
    }

    // [modificación] Si solo se pide el conteo
    if (detail !== 'true') {
      return NextResponse.json({
        count: participantsList.length,
        message: `Total de ${participantsList.length} participantes únicos`
      });
    }

    // [modificación] Si se pide el detalle completo, devolver la lista
    return NextResponse.json({
      count: participantsList.length,
      participants: participantsList,
      message: `Lista completa de ${participantsList.length} participantes únicos`
    });

  } catch (err: Error | unknown) {
    console.error('Error del servidor en participants:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', details: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 