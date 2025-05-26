import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // [modificación] Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      console.error('API /admin/sessions/close: supabaseAdmin no está disponible');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // [modificación] Parsear el cuerpo de la solicitud
    const { sessionId } = await request.json();

    // [modificación] Validar que se proporcione el sessionId
    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID de sesión requerido' },
        { status: 400 }
      );
    }

    // [modificación] Verificar que la sesión existe antes de cerrarla
    const { data: existingSession, error: checkError } = await supabaseAdmin
      .from('plays')
      .select('id, session_id, status')
      .eq('session_id', sessionId)
      .single();

    if (checkError || !existingSession) {
      console.error('Error al verificar sesión:', checkError);
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // [modificación] Verificar que la sesión no esté ya cerrada
    if (existingSession.status === 'completed' || existingSession.status === 'archived') {
      return NextResponse.json(
        { error: 'La sesión ya está cerrada' },
        { status: 400 }
      );
    }

    // [modificación] Actualizar el estado de la sesión a 'completed'
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('plays')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error al cerrar sesión:', updateError);
      return NextResponse.json(
        { error: 'Error al cerrar la sesión' },
        { status: 500 }
      );
    }

    // [modificación] Respuesta exitosa con información de la sesión cerrada
    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
      session: updatedSession
    });

  } catch (error) {
    console.error('Error en endpoint de cierre de sesión:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 