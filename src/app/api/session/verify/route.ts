import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isPlayerRegistered, isSessionPendingRegistration } from '@/utils/session';

// [modificación] API endpoint para verificar si una sesión existe en el servidor
// Esto nos da acceso directo a la base de datos usando permisos de administrador
export async function GET(request: Request) {
  try {
    // Extraer el sessionId de los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // [modificación] Registrar la solicitud para depuración
    console.log(`Verificando sesión: ${sessionId}`);

    // Validar el parámetro sessionId
    if (!sessionId) {
      return NextResponse.json(
        { message: 'ID de sesión no proporcionado', valid: false },
        { status: 400 }
      );
    }

    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      console.error('supabaseAdmin no está disponible - verificar SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos', valid: false },
        { status: 500 }
      );
    }

    // [modificación] Realizar la consulta con supabaseAdmin para verificar la existencia de la sesión
    // Buscar todos los registros con este session_id y ordenar por prioridad:
    // 1. Registros con jugador registrado (nombre y email completos)
    // 2. Registros más recientes
    const { data: allSessionData, error } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error al verificar sesión ${sessionId}:`, error);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', valid: false, error: error.message },
        { status: 500 }
      );
    }

    // [modificación] Si encontramos registros de la sesión, seleccionar el más apropiado
    if (allSessionData && allSessionData.length > 0) {
      // Priorizar registros con datos completos de jugador
      const playerRegisteredRecord = allSessionData.find(record => 
        record.status === 'player_registered' && record.nombre && record.email
      );
      
      // Si hay un jugador registrado, usar ese registro
      const data = playerRegisteredRecord || allSessionData[0];
      
      console.log(`Sesión ${sessionId} encontrada:`, data);
      if (allSessionData.length > 1) {
        console.log(`Múltiples registros encontrados para sesión ${sessionId}, usando el más apropiado`);
      }
      
      // [modificación] Verificar explícitamente si el jugador está registrado usando funciones utilitarias
      if (isPlayerRegistered(data)) {
        console.log(`Sesión ${sessionId} tiene jugador registrado: ${data.nombre} (${data.email})`);
      } else if (isSessionPendingRegistration(data)) {
        console.log(`Sesión ${sessionId} está pendiente de registro de jugador`);
      } else {
        console.log(`Sesión ${sessionId} está en estado: ${data.status}`);
      }
      
      return NextResponse.json({
        message: 'Sesión encontrada',
        valid: true,
        data
      });
    }

    // [modificación] Si no encontramos ningún registro con este session_id
    console.log(`Sesión ${sessionId} no encontrada en la base de datos`);
    return NextResponse.json(
      { message: 'Sesión no encontrada', valid: false },
      { status: 404 }
    );

  } catch (err: Error | unknown) {
    console.error('Error en la verificación de sesión:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', valid: false, error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 