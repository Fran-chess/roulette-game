import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API endpoint para verificar si una sesión existe en el servidor
 * CORREGIDO: Ahora usa game_sessions en lugar de plays
 * Esto nos da acceso directo a la base de datos usando permisos de administrador
 */
export async function GET(request: Request) {
  try {
    // Extraer el sessionId de los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

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

    // CORREGIDO: Buscar la sesión en game_sessions
    const { data: sessionData, error } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) {
      console.error(`Error al verificar sesión ${sessionId}:`, error);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', valid: false, error: error.message },
        { status: 500 }
      );
    }

    // Si no se encuentra la sesión
    if (!sessionData) {
      console.log(`❌ Sesión ${sessionId} no encontrada en game_sessions`);
      return NextResponse.json(
        { message: 'Sesión no encontrada', valid: false },
        { status: 404 }
      );
    }

    // Sesión encontrada
    console.log(`✅ Sesión ${sessionId} encontrada:`, {
      id: sessionData.id,
      status: sessionData.status,
      admin_id: sessionData.admin_id,
      created_at: sessionData.created_at
    });

    return NextResponse.json({
      message: 'Sesión encontrada',
      valid: true,
      data: sessionData,
      sessionId: sessionData.session_id,
      status: sessionData.status
    });

  } catch (error: unknown) {
    console.error('Error general en verificación de sesión:', error);
    return NextResponse.json(
      { 
        message: 'Error interno del servidor', 
        valid: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 
