import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isPlayerRegistered } from '@/utils/session';
import type { PlaySession } from '@/types';

/**
 * API endpoint para resetear los datos de un jugador en una sesión
 * Esto permite que un nuevo jugador se registre en la misma sesión
 */
export async function POST(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }
    
    const { sessionId, adminId } = await request.json();
    
    // Validar campos obligatorios
    if (!sessionId) {
      return NextResponse.json(
        { message: 'ID de sesión es obligatorio' },
        { status: 400 }
      );
    }

    console.log(`Reseteando datos de jugador para sesión: ${sessionId}`);
    
    // [modificación] Buscar TODOS los registros de la sesión en lugar de uno solo
    const { data: allSessionData, error: sessionFetchError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
      
    if (sessionFetchError) {
      console.error('Error al buscar la sesión:', sessionFetchError);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', error: sessionFetchError.message },
        { status: 500 }
      );
    }
    
    if (!allSessionData || allSessionData.length === 0) {
      return NextResponse.json(
        { message: 'Sesión no encontrada. Verifica el ID de la sesión.' },
        { status: 404 }
      );
    }
    
    // [modificación] Obtener el primer registro (más reciente) para información y hacer cast de tipo seguro
    const firstSessionRaw = allSessionData[0];
    const firstSession = firstSessionRaw as unknown as PlaySession;
    
    // [modificación] Verificar si hay un jugador registrado (solo para información) con validación de tipo
    if (firstSession && typeof firstSession === 'object' && 'status' in firstSession) {
      if (isPlayerRegistered(firstSession)) {
        console.log(`Reseteando jugador: ${firstSession.nombre} (${firstSession.email})`);
      } else {
        console.log(`La sesión no tenía un jugador registrado (estado: ${firstSession.status})`);
      }
    } else {
      console.log('La sesión no tiene un formato válido');
    }
    
    // [modificación] Eliminar TODOS los registros existentes de la sesión (sin importar cuántos sean)
    if (allSessionData.length > 0) {
      console.log(`Eliminando ${allSessionData.length} registros existentes para la sesión ${sessionId}`);
      
      const { error: deleteError } = await supabaseAdmin
        .from('plays')
        .delete()
        .eq('session_id', sessionId);
      
      if (deleteError) {
        console.error('Error al eliminar registros existentes:', deleteError);
        return NextResponse.json(
          { message: 'Error al limpiar registros de la sesión', error: deleteError.message },
          { status: 500 }
        );
      }
      
      console.log(`Eliminados todos los registros de la sesión ${sessionId}`);
    }
    
    // [modificación] Crear un nuevo registro limpio con estado pending_player_registration
    const newSessionData = {
      session_id: sessionId,
      nombre: 'Pendiente',
      apellido: null,
      email: 'pendiente@registro.com',
      especialidad: null,
      participant_id: null,
      lastquestionid: null,
      answeredcorrectly: null,
      score: null,
      premio_ganado: null,
      detalles_juego: null,
      status: 'pending_player_registration',
      admin_id: adminId || firstSession.admin_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_updated_at: new Date().toISOString()
    };
    
    // [modificación] Insertar el nuevo registro limpio
    const { data: newSession, error: insertError } = await supabaseAdmin
      .from('plays')
      .insert(newSessionData)
      .select()
      .single();
      
    if (insertError) {
      console.error('Error al crear nuevo registro de sesión:', insertError);
      return NextResponse.json(
        { message: 'Error al crear nuevo registro de sesión', error: insertError.message },
        { status: 500 }
      );
    }
    
    // Si no hay sesión creada (raro, pero posible)
    if (!newSession) {
      return NextResponse.json(
        { message: 'No se pudo crear el nuevo registro de sesión.' },
        { status: 500 }
      );
    }
    
    console.log(`Sesión ${sessionId} reseteada exitosamente: nuevo estado pending_player_registration`);
    
    return NextResponse.json({
      message: 'Sesión reseteada exitosamente para nuevo participante',
      session: newSession,
      recordsRemoved: allSessionData.length
    });
  } catch (err: Error | unknown) {
    console.error('Error al resetear los datos del jugador:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 