import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { tvProdLogger } from '@/utils/tvLogger';

// GET: Obtener cola de participantes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Obtener sesión con cola
    const { data: session, error } = await supabaseAdmin
      .from('game_sessions')
      .select('waiting_queue')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      tvProdLogger.error('Error al obtener cola:', error);
      return NextResponse.json(
        { error: 'Error al obtener cola' },
        { status: 500 }
      );
    }

    const waitingQueue = session?.waiting_queue || [];

    return NextResponse.json({
      waitingQueue: waitingQueue
    });

  } catch (error) {
    tvProdLogger.error('Error en GET /api/admin/sessions/queue:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST: Guardar cola de participantes
export async function POST(request: NextRequest) {
  try {
    const { sessionId, waitingQueue } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      );
    }

    if (!Array.isArray(waitingQueue)) {
      return NextResponse.json(
        { error: 'waitingQueue debe ser un array' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Actualizar cola en la sesión
    const { error } = await supabaseAdmin
      .from('game_sessions')
      .update({
        waiting_queue: waitingQueue,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) {
      tvProdLogger.error('Error al guardar cola:', error);
      return NextResponse.json(
        { error: 'Error al guardar cola' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Cola guardada exitosamente',
      waitingQueue
    });

  } catch (error) {
    tvProdLogger.error('Error en POST /api/admin/sessions/queue:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}