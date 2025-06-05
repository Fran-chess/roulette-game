import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        message: 'Session ID es requerido'
      }, { status: 400 });
    }

    if (!supabaseAdmin) {
      console.error('❌ API-PARTICIPANTS: supabaseAdmin no está disponible');
      return NextResponse.json({
        success: false,
        message: 'Error de configuración del servidor',
        participants: []
      }, { status: 500 });
    }

    const { data: participants, error } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ API-PARTICIPANTS: Error obteniendo participantes:', error);
      return NextResponse.json({
        success: false,
        message: `Error al obtener participantes: ${error.message}`,
        participants: []
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${participants?.length || 0} participantes encontrados`,
      participants: participants || []
    });

  } catch (error) {
    console.error('❌ API-PARTICIPANTS: Error en API participants:', error);
    return NextResponse.json({
      success: false,
      message: `Error interno del servidor: ${error}`,
      participants: []
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const participantId = searchParams.get('participantId');

    if (!sessionId || !participantId) {
      return NextResponse.json({
        success: false,
        message: 'Session ID y Participant ID son requeridos'
      }, { status: 400 });
    }

    if (!supabaseAdmin) {
      console.error('❌ API-DELETE-PARTICIPANT: supabaseAdmin no está disponible');
      return NextResponse.json({
        success: false,
        message: 'Error de configuración del servidor'
      }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('participant_id', participantId);

    if (error) {
      console.error('❌ API-DELETE-PARTICIPANT: Error eliminando participante:', error);
      return NextResponse.json({
        success: false,
        message: `Error al eliminar participante: ${error.message}`
      }, { status: 500 });
    }

    console.log(`✅ API-DELETE-PARTICIPANT: Participante ${participantId} eliminado de sesión ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: 'Participante eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ API-DELETE-PARTICIPANT: Error en API delete participant:', error);
    return NextResponse.json({
      success: false,
      message: `Error interno del servidor: ${error}`
    }, { status: 500 });
  }
} 