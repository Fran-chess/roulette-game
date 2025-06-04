import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';

/**
 * Endpoint para crear un nuevo juego
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

    // [modificación] Crear nueva sesión de juego directamente sin RPC
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const currentTime = new Date().toISOString();

    const { data: sessionData, error: createError } = await supabaseAdmin
      .from('plays')
      .insert({
        session_id: sessionId,
        admin_id: adminId,
        status: 'pending_player_registration',
        nombre: 'Pendiente',
        email: 'pendiente@registro.com',
        created_at: currentTime,
        updated_at: currentTime,
        admin_updated_at: currentTime
      })
      .select()
      .single();

    if (createError) {
      console.error('Error al crear juego:', createError);
      return NextResponse.json(
        { message: 'Error al crear juego' },
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

    console.log(`✅ Juego creado exitosamente con ID: ${sessionId}`);

    return NextResponse.json({
      message: 'Juego creado exitosamente',
      sessionId,
      session: sessionData,
      sessionDbId: sessionData.id,
      verified: true,
    });
  } catch (err: unknown) {
    console.error('❌ Error en la creación del juego:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
