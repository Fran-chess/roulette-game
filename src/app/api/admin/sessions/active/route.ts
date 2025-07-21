import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';

/**
 * Endpoint para obtener la sesión activa del administrador
 * Solo puede existir una sesión activa a la vez
 */
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }

    const adminId = await getAuthenticatedAdminId();

    if (!adminId) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Buscar la sesión activa (no completada, archivada o cerrada)
    const { data: activeSession, error } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('admin_id', adminId)
      .not('status', 'in', '(completed,archived,closed)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener sesión activa:', error);
      return NextResponse.json(
        { message: 'Error al obtener sesión activa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      activeSession,
      hasActiveSession: !!activeSession
    });
  } catch (err: unknown) {
    console.error('❌ Error al obtener sesión activa:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}