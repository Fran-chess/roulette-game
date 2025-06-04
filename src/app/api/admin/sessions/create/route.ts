import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';
// [modificación] Importar funciones helper que manejan UUID correctamente
import { validateUUID, createGameSession } from '@/lib/supabaseHelpers';

/**
 * Endpoint para crear un nuevo juego usando estructura sessions + plays
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

    // [modificación] Validar que adminId sea un UUID válido
    try {
      validateUUID(adminId);
    } catch (error) {
      console.error('Error: adminId no es un UUID válido:', adminId, error);
      return NextResponse.json(
        { message: 'ID de administrador inválido' },
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

    console.log(`🎮 CREATE: Creando nueva sesión para admin: ${adminId}`);

    // [modificación] Usar función helper simplificada que maneja sessions + plays
    try {
      const sessionUUID = await createGameSession(
        adminId,
        `Sesión creada el ${new Date().toLocaleString('es-ES')}`
      );

      if (!sessionUUID) {
        console.error('Error: sessionUUID no devuelto por createGameSession');
        return NextResponse.json(
          { message: 'Error al generar sesión' },
          { status: 500 }
        );
      }

      console.log(`✅ CREATE: Sesión creada con UUID: ${sessionUUID}`);

      // [modificación] Obtener datos completos de la sesión y play creados
      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('id', sessionUUID)
        .single();

      const { data: playData, error: playError } = await supabaseAdmin
        .from('plays')
        .select('*')
        .eq('session_id', sessionUUID)
        .single();

      if (sessionError || playError || !sessionData || !playData) {
        console.error('Error al obtener datos completos:', { sessionError, playError });
        return NextResponse.json(
          { message: 'Error al obtener detalles de la sesión creada' },
          { status: 500 }
        );
      }

      console.log(`✅ CREATE: Sesión ${sessionUUID} creada exitosamente`);
      console.log(`📊 CREATE: Session: ${sessionData.status}, Play: ${playData.status}`);

      // [modificación] Respuesta con datos completos simplificada
      return NextResponse.json({
        message: 'Sesión creada exitosamente',
        sessionId: sessionUUID,
        session: {
          ...playData, // Datos del play para compatibilidad con frontend
          session_id: sessionUUID, // Asegurar que session_id esté presente
        },
        sessionDetails: sessionData, // Datos de la session
        success: true
      });

    } catch (createError) {
      console.error('Error al crear juego con helper:', createError);
      return NextResponse.json(
        { message: 'Error al crear juego', details: createError instanceof Error ? createError.message : 'Error desconocido' },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error('Error general en creación de sesión:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { 
        message: 'Error interno del servidor',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
