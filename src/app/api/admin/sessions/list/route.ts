// src/app/api/admin/sessions/list/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Usamos supabaseAdmin para bypass RLS
import { getAuthenticatedAdminId } from '@/lib/adminAuth';
// [OPTIMIZADO] Importar logger de producción
import { tvProdLogger } from '@/utils/tvLogger';

/**
 * Endpoint para listar las sesiones de juego del administrador actual
 * CORREGIDO: Ahora usa game_sessions en lugar de plays
 */
export async function GET() {
  try {
    // Paso 1: Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      tvProdLogger.error('API /admin/sessions/list: supabaseAdmin no está disponible');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Paso 2: Obtener el adminId del usuario autenticado
    const adminId = await getAuthenticatedAdminId();
    if (!adminId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Paso 3: Log de depuración (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log(`API /admin/sessions/list: Obteniendo sesiones para adminId: ${adminId}`);
    }

    // CORREGIDO: Consultar game_sessions en lugar de plays
    const { data, error } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false });

    // Paso 5: Manejar errores de la consulta a la base de datos
    if (error) {
      tvProdLogger.error(
        'API /admin/sessions/list: Error al obtener las sesiones de juego:',
        error
      );
      return NextResponse.json(
        {
          message: 'Error al obtener las sesiones de juego',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // Paso 6: Devolver los datos encontrados con el formato esperado
    return NextResponse.json({ sessions: data || [] });
  } catch (err: unknown) {
    // Paso 7: Manejar cualquier otra excepción inesperada
    tvProdLogger.error(
      'API /admin/sessions/list: Excepción general en el endpoint:',
      err
    );

    let errorMessage = 'Error desconocido';
    if (err instanceof Error) {
      errorMessage = err.message;
    }

    return NextResponse.json(
      {
        message: 'Error interno del servidor al obtener sesiones',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
