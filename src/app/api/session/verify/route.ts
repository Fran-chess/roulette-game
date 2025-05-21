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
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos', valid: false },
        { status: 500 }
      );
    }

    // [modificación] Realizar la consulta con supabaseAdmin para verificar la existencia de la sesión
    // usando exactamente el ID proporcionado
    const { data, error } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error(`Error al verificar sesión ${sessionId}:`, error);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', valid: false, error: error.message },
        { status: 500 }
      );
    }

    // [modificación] Si encontramos la sesión, devolvemos sus datos
    if (data) {
      console.log(`Sesión ${sessionId} encontrada:`, data);
      
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

    // [modificación] Si no encontramos la sesión, intentamos verificar su existencia de otra manera
    try {
      // Consulta SQL directa para mayor flexibilidad
      const { data: sqlData, error: sqlError } = await supabaseAdmin.rpc(
        'check_session_exists',
        { session_id_param: sessionId }
      );
      
      if (sqlError) {
        console.error(`Error en check_session_exists para ${sessionId}:`, sqlError);
        return NextResponse.json(
          { message: 'Error al verificar la sesión mediante RPC', valid: false, error: sqlError.message },
          { status: 500 }
        );
      }
      
      if (sqlData === true) {
        // [modificación] Si la sesión existe pero no pudimos obtenerla directamente
        console.log(`Sesión ${sessionId} existe según RPC pero no obtuvimos sus datos`);
        return NextResponse.json({
          message: 'Sesión encontrada por RPC',
          valid: true,
          data: {
            session_id: sessionId,
            status: 'pending_player_registration',
            created_at: new Date().toISOString()
          }
        });
      }
      
      // [modificación] Si ninguna de las verificaciones encuentra la sesión
      console.log(`Sesión ${sessionId} no encontrada`);
      return NextResponse.json(
        { message: 'Sesión no encontrada', valid: false },
        { status: 404 }
      );
    } catch (rpcError: any) {
      console.error(`Error en verificación RPC para ${sessionId}:`, rpcError);
      
      // [modificación] Si la función RPC no existe, indicamos que es necesario crear la migración
      if (rpcError.message?.includes('function') && rpcError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            message: 'Es necesario ejecutar la migración para crear la función check_session_exists', 
            valid: false, 
            error: rpcError.message,
            needsMigration: true
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { message: 'Error en la verificación RPC', valid: false, error: rpcError.message },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('Error en la verificación de sesión:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', valid: false, error: err.message },
      { status: 500 }
    );
  }
} 