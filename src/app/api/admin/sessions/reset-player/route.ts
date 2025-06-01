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
      console.error('reset-player: supabaseAdmin no está disponible');
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }
    
    const { sessionId, adminId } = await request.json();
    
    console.log(`reset-player: Iniciando reset para sessionId: ${sessionId}, adminId: ${adminId}`);
    
    // Validar campos obligatorios
    if (!sessionId) {
      console.error('reset-player: sessionId no proporcionado');
      return NextResponse.json(
        { message: 'ID de sesión es obligatorio' },
        { status: 400 }
      );
    }

    console.log(`reset-player: Reseteando datos de jugador para sesión: ${sessionId}`);
    
    // [modificación] Buscar la sesión existente para obtener información
    const { data: existingSession, error: sessionFetchError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (sessionFetchError) {
      console.error('reset-player: Error al buscar la sesión:', sessionFetchError);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', error: sessionFetchError.message },
        { status: 500 }
      );
    }
    
    if (!existingSession) {
      console.error(`reset-player: Sesión ${sessionId} no encontrada`);
      return NextResponse.json(
        { message: 'Sesión no encontrada. Verifica el ID de la sesión.' },
        { status: 404 }
      );
    }
    
    console.log(`reset-player: Sesión encontrada - estado actual: ${existingSession.status}, participante: ${existingSession.nombre}`);
    
    // [modificación] Cast seguro para TypeScript
    const session = existingSession as unknown as PlaySession;
    
    // [modificación] Log de información del jugador actual (si existe)
    if (session && typeof session === 'object' && 'status' in session) {
      if (isPlayerRegistered(session)) {
        console.log(`reset-player: Reseteando jugador: ${session.nombre} (${session.email})`);
      } else {
        console.log(`reset-player: La sesión no tenía un jugador registrado (estado: ${session.status})`);
      }
    }
    
    // [modificación] ESTRATEGIA NUEVA: Solo UPDATE en lugar de DELETE + INSERT
    // Esto evita el evento DELETE que confunde a la TV
    console.log(`reset-player: Reseteando sesión ${sessionId} con UPDATE (sin DELETE)`);
    
    // [modificación] Función para validar y normalizar adminId
    const normalizeAdminId = (inputAdminId: string | null | undefined): string => {
      // Si no hay adminId, usar el de la sesión existente
      if (!inputAdminId) {
        return session.admin_id || 'system';
      }
      
      // Validar si es un UUID válido (formato básico)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(inputAdminId)) {
        return inputAdminId; // Es un UUID válido
      }
      
      // Si no es UUID válido, intentar usar el admin_id original de la sesión
      if (session.admin_id && uuidRegex.test(session.admin_id)) {
        console.log(`reset-player: adminId "${inputAdminId}" no es UUID válido, usando admin_id original: ${session.admin_id}`);
        return session.admin_id;
      }
      
      // Como último recurso, usar 'system' 
      console.log(`reset-player: adminId "${inputAdminId}" no es UUID válido y no hay admin_id válido en sesión, usando 'system'`);
      return 'system';
    };
    
    const finalAdminId = normalizeAdminId(adminId);
    console.log(`reset-player: AdminId normalizado de "${adminId}" a "${finalAdminId}"`);
    
    const resetData = {
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
      // [modificación] Usar adminId normalizado
      admin_id: finalAdminId,
      updated_at: new Date().toISOString(),
      // [modificación] NO modificar created_at ni admin_updated_at para preservar historial
    };
    
    console.log(`reset-player: Datos para reset (adminId normalizado):`, resetData);
    
    // [modificación] Hacer UPDATE en lugar de DELETE + INSERT
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('plays')
      .update(resetData)
      .eq('session_id', sessionId)
      .select()
      .single();
      
    if (updateError) {
      console.error('reset-player: Error al resetear la sesión:', updateError);
      console.error('reset-player: Error details:', JSON.stringify(updateError, null, 2));
      return NextResponse.json(
        { message: 'Error al resetear la sesión', error: updateError.message, details: updateError },
        { status: 500 }
      );
    }
    
    // Verificar que la actualización fue exitosa
    if (!updatedSession) {
      console.error('reset-player: No se recibieron datos después del update');
      return NextResponse.json(
        { message: 'No se pudo resetear la sesión.' },
        { status: 500 }
      );
    }
    
    console.log(`reset-player: Sesión ${sessionId} reseteada exitosamente: estado cambiado a pending_player_registration`);
    console.log(`reset-player: Sesión actualizada:`, updatedSession);
    
    return NextResponse.json({
      message: 'Sesión reseteada exitosamente para nuevo participante',
      session: updatedSession,
      resetType: 'update_only', // [modificación] Indicar que fue solo UPDATE
      adminIdUsed: finalAdminId // [modificación] Indicar qué adminId se usó finalmente
    });
  } catch (err: Error | unknown) {
    console.error('reset-player: Error al resetear los datos del jugador:', err);
    console.error('reset-player: Stack trace:', err instanceof Error ? err.stack : 'No stack available');
    return NextResponse.json(
      { message: 'Error interno del servidor', error: err instanceof Error ? err.message : 'Error desconocido', details: err },
      { status: 500 }
    );
  }
} 