import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';
import { PlaySession, Participant } from '@/types';

interface SessionWithParticipants extends PlaySession {
  participants: Participant[];
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      console.error('❌ API-SESSIONS-WITH-PARTICIPANTS: supabaseAdmin no está disponible');
      return NextResponse.json({
        success: false,
        message: 'Error de configuración del servidor',
        sessions: []
      }, { status: 500 });
    }

    // Obtener el adminId del usuario autenticado
    const adminId = await getAuthenticatedAdminId();
    if (!adminId) {
      return NextResponse.json({
        success: false,
        message: 'No autorizado',
        sessions: []
      }, { status: 401 });
    }

    // Obtener todas las sesiones del admin (incluyendo todas, no solo activas)
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('❌ API-SESSIONS-WITH-PARTICIPANTS: Error obteniendo sesiones:', sessionsError);
      return NextResponse.json({
        success: false,
        message: `Error al obtener sesiones: ${sessionsError.message}`,
        sessions: []
      }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay sesiones activas',
        sessions: []
      });
    }

    // Obtener todos los participantes de todas las sesiones en una sola consulta
    // Usar los session_id strings, no los UUIDs
    const sessionIds = sessions.map(session => session.session_id);
    
    const { data: allParticipants, error: participantsError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    if (participantsError) {
      console.error('❌ API-SESSIONS-WITH-PARTICIPANTS: Error obteniendo participantes:', participantsError);
      return NextResponse.json({
        success: false,
        message: `Error al obtener participantes: ${participantsError.message}`,
        sessions: []
      }, { status: 500 });
    }

    // Crear un mapa de participantes por session_id string para mejor rendimiento
    const participantsBySessionId = new Map<string, Participant[]>();
    (allParticipants || []).forEach(participant => {
      const sessionId = participant.session_id;
      if (typeof sessionId === 'string') {
        if (!participantsBySessionId.has(sessionId)) {
          participantsBySessionId.set(sessionId, []);
        }
        participantsBySessionId.get(sessionId)!.push(participant as unknown as Participant);
      }
    });

    // Combinar sesiones con sus participantes (usar session_id string)
    const sessionsWithParticipants: SessionWithParticipants[] = sessions.map(session => {
      const typedSession = session as unknown as PlaySession;
      const sessionParticipants = participantsBySessionId.get(typedSession.session_id) || [];
      
      // [PROD] Log de depuración removido
      
      return {
        ...typedSession,
        participants: sessionParticipants
      };
    });

    const totalParticipants = allParticipants?.length || 0;

    // [PROD] Log de resultado final removido

    return NextResponse.json({
      success: true,
      message: `${sessions.length} sesiones encontradas con ${totalParticipants} participantes en total`,
      sessions: sessionsWithParticipants
    });

  } catch (error) {
    console.error('❌ API-SESSIONS-WITH-PARTICIPANTS: Error en API sessions with participants:', error);
    return NextResponse.json({
      success: false,
      message: `Error interno del servidor: ${error}`,
      sessions: []
    }, { status: 500 });
  }
}