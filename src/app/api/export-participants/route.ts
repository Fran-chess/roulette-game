import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    // [modificación] Obtener los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const period = searchParams.get('period');

    // [modificación] Obtener participantes
    let participantsQuery = supabaseAdmin
      .from('participants')
      .select('id, nombre, apellido, email, created_at');
    
    const { data: allParticipants, error: participantsError } = await participantsQuery.order('created_at');

    if (participantsError) {
      console.error('Error al obtener participantes:', participantsError);
      return NextResponse.json(
        { message: 'Error al obtener participantes.', details: participantsError.message },
        { status: 500 }
      );
    }

    if (!allParticipants || allParticipants.length === 0) {
      return NextResponse.json(
        { message: 'No hay participantes registrados.' },
        { status: 404 }
      );
    }

    // [modificación] Obtener todas las jugadas o las de un período específico
    let playsQuery = supabaseAdmin
      .from('plays')
      .select('participant_id, created_at');

    if (period !== 'all' && date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      playsQuery = playsQuery
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    }
    
    const { data: allPlays, error: playsError } = await playsQuery;
    
    if (playsError) {
      console.error('Error al obtener jugadas:', playsError);
      return NextResponse.json(
        { message: 'Error al obtener jugadas.', details: playsError.message },
        { status: 500 }
      );
    }

    // [modificación] Procesar los datos para el Excel
    const participantsMap = new Map();
    
    for (const p of allParticipants) {
      participantsMap.set(p.id, {
        Nombre: p.nombre,
        Apellido: p.apellido || '',
        Email: p.email || '',
        FechaPrimerRegistro: new Date(p.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
        CantidadJugadasHoy: 0,
        CantidadJugadasTotal: 0,
        FechasJugadas: [],
      });
    }

    // [modificación] Contar jugadas totales
    const { data: allPlaysForTotalCount, error: totalCountError } = await supabaseAdmin
      .from('plays')
      .select('participant_id');
    
    if (totalCountError) {
      console.error('Error al contar jugadas totales:', totalCountError);
      return NextResponse.json(
        { message: 'Error al contar jugadas totales.', details: totalCountError.message },
        { status: 500 }
      );
    }

    for (const play of allPlaysForTotalCount || []) {
      if (participantsMap.has(play.participant_id)) {
        const participant = participantsMap.get(play.participant_id);
        participant.CantidadJugadasTotal++;
      }
    }

    // [modificación] Contar jugadas del período/día seleccionado y popular fechas
    for (const play of allPlays || []) {
      if (participantsMap.has(play.participant_id)) {
        const participant = participantsMap.get(play.participant_id);
        participant.CantidadJugadasHoy++;
        (participant.FechasJugadas as string[]).push(
          new Date(play.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
        );
      }
    }

    // [modificación] Preparar datos para la hoja de cálculo
    let dataToSheet: any[] = [];
    
    if (period === 'all') {
      // [modificación] Para el total, usamos CantidadJugadasTotal
      dataToSheet = Array.from(participantsMap.values()).map(p => ({
        Nombre: p.Nombre,
        Apellido: p.Apellido,
        Email: p.Email,
        FechaPrimerRegistro: p.FechaPrimerRegistro,
        CantidadTotalDeJugadas: p.CantidadJugadasTotal,
      }));
    } else if (date) {
      // [modificación] Para un día específico, usamos CantidadJugadasHoy
      dataToSheet = Array.from(participantsMap.values())
        .filter(p => p.CantidadJugadasHoy > 0) // Solo mostrar participantes que jugaron ese día
        .map(p => ({
          Nombre: p.Nombre,
          Apellido: p.Apellido,
          Email: p.Email,
          CantidadJugadasEsteDia: p.CantidadJugadasHoy,
        }));
    }

    if (dataToSheet.length === 0) {
      return NextResponse.json(
        { message: 'No hay datos para exportar con esos criterios.' },
        { status: 404 }
      );
    }

    // [modificación] Crear hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(dataToSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participantes');

    // [modificación] Ajustar el ancho de las columnas
    const colWidths = Object.keys(dataToSheet[0] || {}).map(key => ({
      wch: Math.max(
        key.length, 
        ...dataToSheet.map(row => (row[key as keyof typeof row] || '').toString().length)
      ) + 2
    }));
    worksheet['!cols'] = colWidths;

    // [modificación] Generar buffer del Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // [modificación] Configurar respuesta
    const fileName = `participantes_jugadas_${date || period || 'data'}.xlsx`;
    
    // [modificación] Crear la respuesta con los headers adecuados
    const response = new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
    
    return response;

  } catch (err: any) {
    console.error('Error del servidor en export-participants:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor al exportar', details: err.message },
      { status: 500 }
    );
  }
} 