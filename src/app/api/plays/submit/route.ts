import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Endpoint simplificado para guardar jugadas
 * Sin gestión de sesiones ni participantes
 */
export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }

    const {
      question_id,
      answered_correctly,
      prize_name
    } = await request.json();

    // Validar campos obligatorios
    if (!question_id || typeof answered_correctly !== 'boolean') {
      return NextResponse.json(
        { message: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Crear la jugada en la base de datos
    const playData = {
      id: uuidv4(),
      participant_id: null, // Sin gestión de participantes
      session_id: null, // Sin gestión de sesiones
      admin_id: null, // Sin admin
      lastquestionid: question_id,
      answeredcorrectly: answered_correctly,
      premio_ganado: answered_correctly ? prize_name : null,
      status: 'completed',
      score: answered_correctly ? 1 : 0,
      detalles_juego: {
        question_id,
        answered_correctly,
        prize_offered: prize_name,
        prize_awarded: answered_correctly ? prize_name : null,
        timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: savedPlay, error: saveError } = await supabaseAdmin
      .from('plays')
      .insert(playData)
      .select()
      .single();

    if (saveError) {
      console.error('Error guardando jugada:', saveError);
      return NextResponse.json(
        { message: 'Error guardando la jugada', error: saveError.message },
        { status: 500 }
      );
    }

    // Respuesta simplificada
    return NextResponse.json({
      success: true,
      message: 'Jugada procesada exitosamente',
      play: savedPlay,
      result: {
        answered_correctly,
        prize_awarded: answered_correctly ? prize_name : null,
        message: answered_correctly && prize_name
          ? `¡Felicitaciones! Respuesta correcta y ganaste: ${prize_name}`
          : answered_correctly
          ? '¡Respuesta correcta! Sigue participando.'
          : 'Respuesta incorrecta. ¡Sigue intentando!'
      }
    });

  } catch (error) {
    console.error('Error interno:', error);
    return NextResponse.json(
      { 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}