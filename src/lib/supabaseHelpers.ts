import { supabaseAdmin } from './supabase';

// [modificación] Función para validar y convertir UUID strings
export function validateUUID(value: string | null | undefined): string | null {
  if (!value) return null;
  
  // Verificar que sea un UUID válido (formato básico)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(value)) {
    return value;
  }
  
  throw new Error(`UUID inválido: ${value}`);
}

// [modificación] Función para generar UUID válido
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// [modificación] Función para crear sesión de juego con estructura sessions + plays correcta
export async function createGameSession(adminId: string, descripcion?: string) {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin no está disponible');
  }

  // Validar que adminId sea UUID válido
  validateUUID(adminId);

  console.log(`🎮 SQL_HELPER: Creando sesión para admin: ${adminId}`);

  try {
    // [modificación] PASO 1: Crear registro en tabla sessions primero
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        admin_id: adminId, // UUID validado
        status: 'pending',
        descripcion: descripcion || `Sesión creada el ${new Date().toLocaleString('es-ES')}`
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ SQL_HELPER: Error al crear session:', sessionError);
      throw sessionError;
    }

    // [modificación] Validar y tipear correctamente el sessionUUID
    const sessionUUID = sessionData.id as string;
    if (!sessionUUID || typeof sessionUUID !== 'string') {
      throw new Error('Session ID no devuelto correctamente por la base de datos');
    }

    // Validar que el UUID devuelto sea válido
    validateUUID(sessionUUID);
    
    console.log(`✅ SQL_HELPER: Session creada con UUID: ${sessionUUID}`);

    // [modificación] PASO 2: Crear registro en tabla plays que referencie la session
    const { data: playData, error: playError } = await supabaseAdmin
      .from('plays')
      .insert({
        session_id: sessionUUID, // Referencias a sessions.id
        admin_id: adminId, // UUID validado
        status: 'pending_player_registration',
        nombre: 'Pendiente',
        apellido: null,
        email: 'pendiente@registro.com',
        especialidad: null,
        participant_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        detalles_juego: {
          descripcion: descripcion || `Play inicial para sesión ${sessionUUID}`,
          created_by: 'create_game_session_helper'
        }
      })
      .select()
      .single();

    if (playError) {
      console.error('❌ SQL_HELPER: Error al crear play:', playError);
      // [modificación] Si falla el play, eliminar la session creada para mantener consistencia
      try {
        await supabaseAdmin
          .from('sessions')
          .delete()
          .eq('id', sessionUUID); // Ahora sessionUUID está correctamente tipado como string
      } catch (cleanupError) {
        console.error('❌ SQL_HELPER: Error al limpiar session fallida:', cleanupError);
      }
      throw playError;
    }

    console.log(`✅ SQL_HELPER: Play creado exitosamente para session: ${sessionUUID}`);
    console.log(`📊 SQL_HELPER: Estructura completa: session(${sessionUUID}) -> play(${playData.id})`);
    
    return sessionUUID; // Devolver el session.id para usar en el frontend

  } catch (error) {
    console.error('❌ SQL_HELPER: Error general en createGameSession:', error);
    throw error;
  }
}

// [modificación] Función para registrar participante con tipos UUID correctos
export async function upsertSessionParticipant(
  sessionId: string,
  nombre: string,
  apellido?: string | null,
  email?: string,
  especialidad?: string | null
) {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin no está disponible');
  }

  // Validar que sessionId sea UUID válido
  validateUUID(sessionId);

  console.log(`🔄 SQL_HELPER: Registrando participante en sesión: ${sessionId}`);
  console.log(`👤 SQL_HELPER: Participante: ${nombre} ${apellido || ''} (${email})`);

  try {
    // Generar participant_id único
    const participantId = generateUUID();

    // Inserta una nueva fila en la tabla plays para conservar el historial
    const { data: insertedPlay, error: insertError } = await supabaseAdmin
      .from('plays')
      .insert({
        session_id: sessionId,
        nombre: nombre,
        apellido: apellido,
        email: email || `${nombre.toLowerCase().replace(/\s+/g, '')}@participante.com`,
        especialidad: especialidad,
        participant_id: participantId,
        status: 'player_registered',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ SQL_HELPER: Error al insertar participante:', insertError);
      throw insertError;
    }

    if (!insertedPlay) {
      throw new Error('No se pudo crear el registro del participante');
    }

    console.log(`✅ SQL_HELPER: Participante registrado exitosamente:`, insertedPlay);

    // Retornar en formato array para compatibilidad con RPC
    return [insertedPlay];

  } catch (error) {
    console.error('❌ SQL_HELPER: Error general en upsertSessionParticipant:', error);
    throw error;
  }
}

// [modificación] Función para obtener sesión por ID con validación UUID
export async function getSessionById(sessionId: string) {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin no está disponible');
  }

  // Validar que sessionId sea UUID válido
  validateUUID(sessionId);

  const { data, error } = await supabaseAdmin
    .from('plays')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// [modificación] Función para actualizar estado de sesión con validación UUID
export async function updateSessionStatus(sessionId: string, status: string, adminId?: string) {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin no está disponible');
  }

  // Validar que sessionId sea UUID válido
  validateUUID(sessionId);
  
  if (adminId) {
    validateUUID(adminId);
  }

  const updateData: Record<string, string> = {
    status: status,
    updated_at: new Date().toISOString()
  };

  if (adminId) {
    updateData.admin_updated_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('plays')
    .update(updateData)
    .eq('session_id', sessionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
} 