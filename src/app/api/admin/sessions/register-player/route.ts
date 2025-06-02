import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';

// Endpoint para registrar un jugador en una sesión
export async function POST(request: Request) {
  try {
    // Verificar que supabaseAdmin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }

    if (!(await getAuthenticatedAdminId())) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { sessionId, nombre, apellido, email, especialidad } = await request.json();
    
    // Información de depuración
// //     console.log('Recibida solicitud de registro:', { sessionId, nombre, email });

    // Validar campos obligatorios
    if (!sessionId) {
      return NextResponse.json(
        { message: 'ID de sesión es obligatorio' },
        { status: 400 }
      );
    }

    if (!nombre || !email) {
      return NextResponse.json(
        { message: 'Nombre y email son obligatorios' },
        { status: 400 }
      );
    }

    // [modificación] Buscar la sesión existente para obtener el admin_id correcto
    const { data: existingSession, error: sessionError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('Error al buscar sesión existente:', sessionError);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', error: sessionError.message },
        { status: 500 }
      );
    }

    // [modificación] Determinar el admin_id correcto para la sesión
    let sessionAdminId = 'auto_created'; // valor por defecto como fallback
    let sessionExists = false;

    if (existingSession) {
      sessionExists = true;
      // [modificación] Usar type assertion segura para admin_id
      sessionAdminId = (existingSession.admin_id as string) || 'auto_created';
// //       console.log(`Sesión existente encontrada con admin_id: ${adminId}`);
      
      // Verificar si ya hay un jugador registrado con el mismo email
      if (existingSession.status === 'player_registered' && 
          existingSession.email === email) {
// //         console.log('Participante ya registrado con el mismo email en esta sesión');
        return NextResponse.json({
          message: 'Participante ya registrado en esta sesión',
          session: existingSession,
          isExisting: true
        });
      }
    } else {
// //       console.log(`Sesión ${sessionId} no encontrada, se creará un nuevo registro`);
    }

    // [modificación] Log del admin_id final que se usará
// //     console.log(`Admin ID final que se usará: ${adminId}`);
    
    // [modificación] Advertir si se está usando 'auto_created' ya que puede afectar las notificaciones
    if (sessionAdminId === 'auto_created') {
      console.warn(`⚠️ ADVERTENCIA: Se está usando admin_id='auto_created' para la sesión ${sessionId}.`);
      console.warn(`   Esto puede causar que los administradores no reciban notificaciones en tiempo real.`);
      console.warn(`   Las notificaciones solo funcionarán si el admin está suscrito con filtro admin_id=eq.${sessionAdminId}`);
    } else {
// //       console.log(`✅ Admin ID válido detectado (${adminId}). Las notificaciones en tiempo real deberían funcionar correctamente.`);
    }

    // Crear un ID único para el participante
    const participantId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // [modificación] Datos del participante para actualizar/insertar
    const participantData = {
      session_id: sessionId,
      nombre,
      apellido: apellido || null,
      email,
      especialidad: especialidad || null,
      participant_id: participantId,
      status: 'player_registered',
      admin_id: sessionAdminId,
      updated_at: new Date().toISOString()
    };

    let result;

    if (sessionExists) {
      // [modificación] Si la sesión existe, hacer UPDATE en lugar de DELETE + INSERT
// //       console.log(`Actualizando sesión existente ${sessionId} con datos del jugador`);
      
      const { data: updatedSession, error: updateError } = await supabaseAdmin
        .from('plays')
        .update(participantData)
        .eq('session_id', sessionId)
        .select()
        .single();

      if (updateError) {
        console.error('Error al actualizar sesión con datos del jugador:', updateError);
        return NextResponse.json(
          { message: 'Error al registrar jugador en la sesión', error: updateError.message },
          { status: 500 }
        );
      }

      result = updatedSession;
// //       console.log(`Sesión ${sessionId} actualizada exitosamente con jugador: ${nombre}`);
    } else {
      // [modificación] Si no existe la sesión, crear una nueva con INSERT
// //       console.log(`Creando nueva sesión ${sessionId} con datos del jugador`);
      
      const newSessionData = {
        ...participantData,
        created_at: new Date().toISOString()
      };

      const { data: newSession, error: insertError } = await supabaseAdmin
        .from('plays')
        .insert(newSessionData)
        .select()
        .single();

      if (insertError) {
        console.error('Error al crear nueva sesión con jugador:', insertError);
        return NextResponse.json(
          { message: 'Error al crear sesión con jugador', error: insertError.message },
          { status: 500 }
        );
      }

      result = newSession;
// //       console.log(`Nueva sesión ${sessionId} creada exitosamente con jugador: ${nombre}`);
    }

// //     console.log(`Participante ${nombre} registrado exitosamente en la sesión ${sessionId} con estado: player_registered`);

    // [modificación] Verificación adicional para asegurar que el cambio se propagó
// //     console.log('🔍 REGISTER: Verificando que el cambio se aplicó correctamente en la base de datos...');
    const { data: verificationData, error: verificationError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (verificationError) {
      console.warn('⚠️ REGISTER: Error en verificación post-registro:', verificationError);
    } else {
// //       console.log('✅ REGISTER: Verificación exitosa - Estado actual en DB:', verificationData.status);
// //       console.log('✅ REGISTER: Participante en DB:', verificationData.nombre, '(' + verificationData.email + ')');
// //       console.log('✅ REGISTER: Admin ID:', verificationData.admin_id);
// //       console.log('✅ REGISTER: Timestamp updated_at:', verificationData.updated_at);
      
      // [modificación] Notificación específica para la TV
      if (verificationData.status === 'player_registered') {
// //         console.log('🎯 REGISTER: ¡Participante registrado exitosamente! La TV debería cambiar a ruleta automáticamente via realtime');
      }
    }

    return NextResponse.json({
      message: 'Participante registrado exitosamente',
      session: result,
      isNew: !sessionExists
    });

  } catch (err: Error | unknown) {
    console.error('Error en el registro de participante:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 
