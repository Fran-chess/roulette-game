import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { tvProdLogger } from '@/utils/tvLogger';

// GET: Obtener cola de participantes con datos completos
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
      // Si no encuentra la sesión, devolver cola vacía en lugar de error 500
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          waitingQueue: [],
          participants: []
        });
      }
      tvProdLogger.error('Error al obtener cola:', error);
      return NextResponse.json(
        { error: 'Error al obtener cola' },
        { status: 500 }
      );
    }

    const queueIds: string[] = Array.isArray(session?.waiting_queue) ? session.waiting_queue : [];

    // Si no hay cola, devolver vacío
    if (queueIds.length === 0) {
      return NextResponse.json({
        waitingQueue: [],
        participants: []
      });
    }

    // Obtener solo los participantes que están en la cola actual
    // y que no han sido completados, descalificados o removidos de la cola
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .in('id', queueIds)
      .neq('status', 'completed')
      .neq('status', 'disqualified');

    if (participantsError) {
      tvProdLogger.error('Error al obtener participantes de cola:', participantsError);
      return NextResponse.json(
        { error: 'Error al obtener participantes' },
        { status: 500 }
      );
    }

    // Debug: Log what we got from database
    console.log(`🔍 QUEUE-API: IDs solicitados desde waiting_queue: ${queueIds.join(', ')}`);
    console.log(`🔍 QUEUE-API: Participantes encontrados después del filtro: ${participants?.length || 0}`);
    participants?.forEach((p) => {
      console.log(`   - ${p.nombre} (${String(p.id).slice(0,8)}...) status: ${p.status}`);
    });

    // Reconstruir cola en el orden correcto según los IDs
    const orderedParticipants = queueIds
      .map(id => participants?.find(p => p.id === id))
      .filter(p => p !== undefined);

    // Eliminar duplicados basándose en el ID
    const uniqueParticipants = orderedParticipants.filter((participant, index, self) => 
      index === self.findIndex(p => p.id === participant.id)
    );

    return NextResponse.json({
      waitingQueue: queueIds,
      participants: uniqueParticipants
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

    // Debug: Log what we're saving
    console.log(`💾 QUEUE-API-POST: Guardando cola para sesión ${sessionId}`);
    console.log(`💾 QUEUE-API-POST: IDs a guardar:`, waitingQueue);

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