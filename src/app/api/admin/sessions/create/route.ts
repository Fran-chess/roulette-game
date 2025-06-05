import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';

/**
 * Endpoint para crear una nueva sesión de juego
 * CORREGIDO: Ahora usa game_sessions en lugar de plays
 */
export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }

    void request;
    const adminId = await getAuthenticatedAdminId();

    if (!adminId) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el admin existe
    const { data: adminExists, error: adminCheckError } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', adminId)
      .single();

    if (adminCheckError) {
      console.error('Error al verificar admin:', adminCheckError);
      return NextResponse.json(
        { message: 'Error al verificar administrador' },
        { status: 500 }
      );
    }
    if (!adminExists) {
      return NextResponse.json(
        { message: 'Administrador no encontrado' },
        { status: 404 }
      );
    }

    // CORREGIDO: Crear nueva sesión en game_sessions, NO en plays
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const currentTime = new Date().toISOString();

    const { data: sessionData, error: createError } = await supabaseAdmin
      .from('game_sessions')
      .insert({
        session_id: sessionId,
        admin_id: adminId,
        status: 'pending_player_registration',
        created_at: currentTime,
        updated_at: currentTime
      })
      .select()
      .single();

    if (createError) {
      console.error('Error al crear sesión de juego:', createError);
      return NextResponse.json(
        { message: 'Error al crear sesión de juego' },
        { status: 500 }
      );
    }

    if (!sessionData) {
      console.error('Error: No se pudieron obtener los datos de la sesión creada');
      return NextResponse.json(
        { message: 'Error al obtener datos de la sesión' },
        { status: 500 }
      );
    }

    console.log(`✅ Sesión de juego creada exitosamente con ID: ${sessionId}`);

    return NextResponse.json({
      message: 'Sesión de juego creada exitosamente',
      sessionId,
      session: sessionData,
      sessionDbId: sessionData.id,
      verified: true,
    });
  } catch (err: unknown) {
    console.error('❌ Error en la creación de la sesión de juego:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
