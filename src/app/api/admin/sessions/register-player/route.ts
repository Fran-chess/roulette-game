import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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
    
    const { sessionId, nombre, apellido, email, especialidad } = await request.json();
    
    // Información de depuración
    console.log('Recibida solicitud de registro:', { sessionId, nombre, email });

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

    // Verificar si ya existe un participante con el mismo email en esta sesión
    const { data: existingParticipant, error: checkError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error al verificar participante existente:', checkError);
      return NextResponse.json(
        { message: 'Error al verificar participante existente', error: checkError.message },
        { status: 500 }
      );
    }

    // Si ya existe un participante con el mismo email, devolver información
    if (existingParticipant) {
      return NextResponse.json({
        message: 'Participante ya registrado en esta sesión',
        session: existingParticipant,
        isExisting: true
      });
    }

    // Verificar que la sesión existe (buscar cualquier registro con este session_id)
    const { data: sessionExists, error: sessionCheckError } = await supabaseAdmin
      .from('plays')
      .select('session_id, admin_id')
      .eq('session_id', sessionId)
      .limit(1)
      .maybeSingle();

    if (sessionCheckError) {
      console.error('Error al verificar sesión:', sessionCheckError);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', error: sessionCheckError.message },
        { status: 500 }
      );
    }

    // Si no existe ningún registro para esta sesión, crear uno básico
    if (!sessionExists) {
      console.log(`No se encontró sesión existente para ${sessionId}, se creará una nueva entrada`);
      // En lugar de usar RPC, simplemente continuamos con la creación del participante
      // La sesión se considera válida si llega a este punto
    }

    // Crear un ID único para el participante
    const participantId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Crear un nuevo registro para este participante (no actualizar existente)
    const newParticipantData = {
      session_id: sessionId,
      nombre,
      apellido: apellido || null,
      email,
      especialidad: especialidad || null,
      participant_id: participantId,
      status: 'player_registered',
      admin_id: sessionExists?.admin_id || 'auto_created',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Creando nuevo registro de participante:', newParticipantData);

    // Insertar nuevo registro en lugar de actualizar
    const { data: newSession, error: insertError } = await supabaseAdmin
      .from('plays')
      .insert(newParticipantData)
      .select()
      .single();

    if (insertError) {
      console.error('Error al registrar nuevo participante:', insertError);
      return NextResponse.json(
        { message: 'Error al registrar participante en la sesión', error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Participante registrado exitosamente',
      session: newSession,
      isNew: true
    });

  } catch (err: Error | unknown) {
    console.error('Error en el registro de participante:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 