import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// [modificación] Función de utilidad para esperar hasta que la sesión exista
async function waitForSessionCreation(sessionId: string, maxAttempts = 5): Promise<boolean> {
  // Verificar que supabaseAdmin esté disponible
  if (!supabaseAdmin) {
    console.error('Error: supabaseAdmin no está disponible');
    return false;
  }
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Verificando creación de juego ${sessionId}, intento ${attempt + 1}/${maxAttempts}`);
    
    const { data, error } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
      
    if (error) {
      console.error('Error al verificar juego:', error);
    } else if (data) {
      console.log('Juego verificado correctamente:', data);
      return true;
    }
    
    // Esperar cada vez más tiempo entre intentos
    await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
  }
  
  return false;
}

// Endpoint para crear un nuevo juego
export async function POST(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }
    
    const { adminId } = await request.json();

    // Validar campos obligatorios
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
      {
        p_admin_id: adminId
      }
    );

    if (createError) {
      console.error('Error al crear juego:', createError);
      return NextResponse.json(
        { message: 'Error al crear juego' },
        { status: 500 }
      );
    }

    // [modificación] Validar y convertir sessionId a string
    if (!sessionIdRaw || typeof sessionIdRaw !== 'string') {
      console.error('Error: sessionId no es válido:', sessionIdRaw);
      return NextResponse.json(
        { message: 'Error al generar ID de sesión' },
        { status: 500 }
      );
    }

    const sessionId: string = sessionIdRaw;
    console.log(`Juego creado con ID de sesión: ${sessionId}`);

    // [modificación] Esperar explícitamente a que el juego esté creado
    const sessionCreated = await waitForSessionCreation(sessionId);
    
    if (!sessionCreated) {
      console.error('No se pudo verificar la creación del juego después de múltiples intentos');
      // Continuamos de todos modos, pero registramos el error
    }

    // Obtener los detalles completos del juego creado
    let sessionData;
    const { data, error: fetchError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (fetchError) {
      console.error('Error al obtener detalles del juego:', fetchError);
      // No devolvemos error, ya que el juego se creó correctamente
    } else {
      sessionData = data;
      console.log('Datos del juego obtenidos:', sessionData);
      
      // Asegurarnos de que el estado sea 'pending_player_registration'
      if (sessionData && sessionData.status !== 'pending_player_registration') {
        // Actualizar el estado del juego
        const { error: updateError } = await supabaseAdmin
          .from('plays')
          .update({ status: 'pending_player_registration' })
          .eq('session_id', sessionId);
        
        if (updateError) {
          console.error('Error al actualizar estado del juego:', updateError);
        } else {
          // [modificación] Otro pequeño retraso después de la actualización
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Obtener los datos actualizados
          const { data: updatedData } = await supabaseAdmin
            .from('plays')
            .select('*')
            .eq('session_id', sessionId)
            .single();
          
          if (updatedData) {
            sessionData = updatedData;
            console.log('Datos del juego actualizados:', sessionData);
          }
        }
      }
    }

    // [modificación] Verificar que el juego realmente existe antes de responder
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .single();
      
    if (verifyError || !verifyData) {
      console.warn('El juego fue creado pero no se pudo verificar:', { verifyError });
    } else {
      console.log('Verificación final del juego:', verifyData);
    }

    // Asegurarnos de devolver el ID de sesión correctamente y campos más claros
    return NextResponse.json({
      message: 'Juego creado exitosamente',
      sessionId,  // ID generado por la función RPC
      session: sessionData || null,  // Datos completos del juego
      sessionDbId: sessionData?.id || null,  // ID de la base de datos (importante)
      verified: sessionCreated
    });
  } catch (err: Error | unknown) {
    console.error('Error en la creación del juego:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 