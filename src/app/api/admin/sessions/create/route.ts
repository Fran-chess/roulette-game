import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Función de utilidad para esperar hasta que la sesión exista
 */
async function waitForSessionCreation(
  sessionId: string,
  maxAttempts = 5
): Promise<boolean> {
  if (!supabaseAdmin) {
    console.error('Error: supabaseAdmin no está disponible');
    return false;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Verificando creación de juego ${sessionId}, intento ${attempt + 1}/${maxAttempts}`);

    // [modificación] Eliminados genéricos: supabaseAdmin infiere el tipo
    const { data, error } = await supabaseAdmin
      .from('plays')       // línea original con .from<Play>('plays')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();      // evita 406 si no hay filas

    if (error) {
      console.error('Error al verificar juego:', error);
    } else if (data) {
      console.log('Juego verificado correctamente:', data);
      return true;
    }

    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }

  return false;
}

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

    const { adminId } = await request.json();

    if (!adminId) {
      return NextResponse.json(
        { message: 'ID de administrador es obligatorio' },
        { status: 400 }
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

    // Crear nueva sesión de juego
    const { data: sessionIdRaw, error: createError } = await supabaseAdmin.rpc(
      'create_game_session',
      { p_admin_id: adminId }
    );

    if (createError) {
      console.error('Error al crear juego:', createError);
      return NextResponse.json(
        { message: 'Error al crear juego' },
        { status: 500 }
      );
    }
    if (!sessionIdRaw || typeof sessionIdRaw !== 'string') {
      console.error('Error: sessionId no es válido:', sessionIdRaw);
      return NextResponse.json(
        { message: 'Error al generar ID de sesión' },
        { status: 500 }
      );
    }
    const sessionId: string = sessionIdRaw;
    console.log(`Juego creado con ID de sesión: ${sessionId}`);

    // [modificación] Esperar a que la sesión esté realmente en la tabla
    const sessionCreated = await waitForSessionCreation(sessionId);
    if (!sessionCreated) {
      console.error(
        'No se pudo verificar la creación del juego después de múltiples intentos'
      );
    }

    // [modificación] Quitar tipo any: dejamos que infiera
    let sessionData = null;

    // Obtener los detalles completos del juego creado
    const { data, error: fetchError } = await supabaseAdmin
      .from('plays')       // línea original con .from<Play>('plays')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error al obtener detalles del juego:', fetchError);
    } else {
      sessionData = data;
      console.log('Datos del juego obtenidos:', sessionData);

      // Asegurarnos de que el estado sea 'pending_player_registration'
      if (sessionData?.status !== 'pending_player_registration') {
        const { error: updateError } = await supabaseAdmin
          .from('plays')     // línea original con .from<Play>('plays')
          .update({ status: 'pending_player_registration' })
          .eq('session_id', sessionId);

        if (updateError) {
          console.error('Error al actualizar estado del juego:', updateError);
        } else {
          await new Promise((r) => setTimeout(r, 300));
          const { data: updatedData } = await supabaseAdmin
            .from('plays')   // línea original con .from<Play>('plays')
            .select('*')
            .eq('session_id', sessionId)
            .maybeSingle();
          if (updatedData) {
            sessionData = updatedData;
            console.log('Datos del juego actualizados:', sessionData);
          }
        }
      }
    }

    // Verificación final
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('plays')       // línea original con .from<Play>('plays')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (verifyError || !verifyData) {
      console.warn('El juego fue creado pero no se pudo verificar:', { verifyError });
    } else {
      console.log('Verificación final del juego:', verifyData);
    }

    return NextResponse.json({
      message: 'Juego creado exitosamente',
      sessionId,
      session: sessionData,
      sessionDbId: sessionData?.id ?? null,
      verified: sessionCreated,
    });
  } catch (err: unknown) {
    console.error('Error en la creación del juego:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
