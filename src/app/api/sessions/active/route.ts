import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
// [OPTIMIZADO] Importar logger de producción
import { tvProdLogger } from '@/utils/tvLogger';

/**
 * Endpoint público para obtener la sesión activa (para interfaz TV)
 * No requiere autenticación de admin
 */
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }

    // Buscar cualquier sesión activa (no completada, archivada o cerrada)
    const { data: activeSession, error } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .not('status', 'in', '(completed,archived,closed)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      tvProdLogger.error('Error al obtener sesión activa (TV):', error);
      return NextResponse.json(
        { message: 'Error al obtener sesión activa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session: activeSession,
      hasActiveSession: !!activeSession
    });
  } catch (err: unknown) {
    tvProdLogger.error('❌ Error al obtener sesión activa (TV):', err);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}