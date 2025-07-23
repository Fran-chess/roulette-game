import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';

// [modificación] Función auxiliar para convertir de manera segura unknown a Date
function safeCreateDate(value: unknown): Date {
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  if (value instanceof Date) {
    return value;
  }
  // Si no es un tipo válido, devolver la fecha actual como fallback
  console.warn('Valor de fecha inválido:', value, 'usando fecha actual como fallback');
  return new Date();
}

export async function GET(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }
    
    // [modificación] Obtener los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const period = searchParams.get('period');

    // Optimización SQL: Una sola query con agregaciones en lugar de múltiples consultas y loops JS
    let dataToSheet: Record<string, string | number>[] = [];
    
    if (period === 'all') {
      // Optimización SQL: Usar función RPC con agregación SQL nativa
      const { data: participantsWithTotalPlays, error: totalPlaysError } = await supabaseAdmin
        .rpc('get_participants_with_total_plays');

      if (totalPlaysError) {
        console.error('Error al obtener participantes con jugadas totales:', totalPlaysError);
        return NextResponse.json(
          { message: 'Error al obtener datos de participantes.', details: totalPlaysError instanceof Error ? totalPlaysError.message : String(totalPlaysError) },
          { status: 500 }
        );
      }

      if (!participantsWithTotalPlays || !Array.isArray(participantsWithTotalPlays) || participantsWithTotalPlays.length === 0) {
        return NextResponse.json(
          { message: 'No hay participantes registrados.' },
          { status: 404 }
        );
      }

      // Los datos ya vienen agregados desde la función SQL
      dataToSheet = (participantsWithTotalPlays as unknown as { nombre: string; apellido?: string; email?: string; created_at: string; plays_count: number }[]).map((p: { nombre: string; apellido?: string; email?: string; created_at: string; plays_count: number }) => ({
        Nombre: p.nombre,
        Apellido: p.apellido || '',
        Email: p.email || '',
        FechaPrimerRegistro: safeCreateDate(p.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
        CantidadTotalDeJugadas: p.plays_count,
      }));
    } else if (date) {
      // Query optimizada: filtro de fecha en SQL con COUNT agregado
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Usar SQL con filtro de fecha y conteo agregado
      const { data: participantsWithDayPlays, error: dayPlaysError } = await supabaseAdmin
        .rpc('get_participants_with_day_plays', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

      if (dayPlaysError) {
        // Fallback a query manual si la función RPC no existe
        console.warn('RPC function not found, falling back to manual query');
        
        const { data: dayPlaysData, error: fallbackError } = await supabaseAdmin
          .from('participants')
          .select(`
            nombre,
            apellido,
            email,
            plays!inner(
              created_at
            )
          `)
          .gte('plays.created_at', startDate.toISOString())
          .lte('plays.created_at', endDate.toISOString());

        if (fallbackError) {
          console.error('Error al obtener participantes del día:', fallbackError);
          return NextResponse.json(
            { message: 'Error al obtener datos del día.', details: fallbackError instanceof Error ? fallbackError.message : String(fallbackError) },
            { status: 500 }
          );
        }

        if (!dayPlaysData || !Array.isArray(dayPlaysData) || dayPlaysData.length === 0) {
          return NextResponse.json(
            { message: 'No hay datos para exportar con esos criterios.' },
            { status: 404 }
          );
        }

        // Agrupar y contar jugadas por participante usando Map para optimizar
        const participantPlayCounts = new Map();
        
        dayPlaysData.forEach(p => {
          const key = `${p.nombre}-${p.apellido}-${p.email}`;
          if (participantPlayCounts.has(key)) {
            participantPlayCounts.get(key).count++;
          } else {
            participantPlayCounts.set(key, {
              nombre: p.nombre,
              apellido: p.apellido || '',
              email: p.email || '',
              count: 1
            });
          }
        });

        dataToSheet = Array.from(participantPlayCounts.values()).map(p => ({
          Nombre: p.nombre,
          Apellido: p.apellido,
          Email: p.email,
          CantidadJugadasEsteDia: p.count,
        }));
      } else {
        // Usar resultados de la función RPC optimizada
        dataToSheet = (participantsWithDayPlays as unknown as { nombre: string; apellido?: string; email?: string; created_at: string; plays_count: number }[]).map((p: { nombre: string; apellido?: string; email?: string; created_at: string; plays_count: number }) => ({
          Nombre: p.nombre,
          Apellido: p.apellido || '',
          Email: p.email || '',
          CantidadJugadasEsteDia: p.plays_count,
        }));
      }
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

  } catch (err: Error | unknown) {
    console.error('Error del servidor en export-participants:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor al exportar', details: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 