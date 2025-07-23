import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Endpoint para procesar y guardar jugadas de participantes
 * Implementa la lógica para que un participante solo pueda ganar un premio por sesión
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
      participant_id,
      session_id,
      question_id,
      answered_correctly,
      prize_name,
      admin_id
    } = await request.json();

    // [PROD] Logs de debug removidos para producción

    // Validar campos obligatorios
    if (!participant_id || !session_id || !question_id || typeof answered_correctly !== 'boolean') {
      return NextResponse.json(
        { message: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que el participante existe
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id, nombre, session_id')
      .eq('id', participant_id)
      .single();

    if (participantError || !participant) {
      console.error('❌ SUBMIT-PLAY: Participante no encontrado:', participantError);
      return NextResponse.json(
        { message: 'Participante no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el participante pertenece a la sesión
    if (participant.session_id !== session_id) {
      console.error('❌ SUBMIT-PLAY: Participante no pertenece a la sesión');
      return NextResponse.json(
        { message: 'Participante no pertenece a la sesión especificada' },
        { status: 400 }
      );
    }

    // 🏆 LÓGICA PRINCIPAL: Verificar si el participante ya ganó un premio en esta sesión
    let yaGano = false;
    if (answered_correctly && prize_name) {
      const { data: previousWins, error: winCheckError } = await supabaseAdmin
        .from('plays')
        .select('id, premio_ganado, created_at')
        .eq('participant_id', participant_id)
        .not('premio_ganado', 'is', null)
        .neq('premio_ganado', '')
        .limit(1);

      if (winCheckError) {
        console.error('SUBMIT-PLAY: Error verificando premios anteriores:', winCheckError);
        return NextResponse.json(
          { message: 'Error verificando premios anteriores' },
          { status: 500 }
        );
      }

      yaGano = previousWins && previousWins.length > 0;
    }

    // No asignamos premios específicos - se entregan presencialmente
    const premioFinal = null;

    // [PROD] Logs de resultado removidos

    // Crear la jugada en la base de datos
    const playData = {
      id: uuidv4(),
      participant_id,
      session_id,
      // [modificación] Asignar admin_id solo si es UUID válido (36 caracteres), sino null
      admin_id: (admin_id && admin_id.length === 36) ? admin_id : null,
      lastquestionid: question_id,
      answeredcorrectly: answered_correctly,
      premio_ganado: premioFinal,
      status: 'completed',
      score: answered_correctly ? 1 : 0,
      detalles_juego: {
        question_id,
        answered_correctly,
        prize_offered: prize_name,
        prize_awarded: premioFinal,
        already_won_prize: yaGano,
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
      console.error('❌ SUBMIT-PLAY: Error guardando jugada:', saveError);
      return NextResponse.json(
        { message: 'Error guardando la jugada', error: saveError.message },
        { status: 500 }
      );
    }

    // [PROD] Log de confirmación removido

    // Respuesta con información completa para el frontend
    return NextResponse.json({
      success: true,
      message: 'Jugada procesada exitosamente',
      play: savedPlay,
      result: {
        answered_correctly,
        prize_awarded: premioFinal,
        already_won_prize: yaGano,
        message: yaGano && answered_correctly && prize_name
          ? `¡Respuesta correcta! Sin embargo, ya ganaste un premio anteriormente. ¡Gracias por seguir participando!`
          : answered_correctly && premioFinal
          ? `¡Felicitaciones! Respuesta correcta y ganaste: ${premioFinal}`
          : answered_correctly
          ? '¡Respuesta correcta! Sigue participando.'
          : 'Respuesta incorrecta. ¡Sigue intentando!'
      }
    });

  } catch (error) {
    console.error('❌ SUBMIT-PLAY: Error interno:', error);
    return NextResponse.json(
      { 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 