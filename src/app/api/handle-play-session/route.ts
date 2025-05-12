import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // [modificación] Obtener los datos del cuerpo de la petición
    const body = await request.json();
    const { nombre, apellido, email } = body;

    // [modificación] Validaciones
    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { message: 'El nombre es obligatorio.' },
        { status: 400 }
      );
    }

    // [modificación] - Eliminada validación obligatoria de apellido
    // El apellido ahora es opcional, consistente con el formulario

    // [modificación] Validación de email
    if (!email || email.trim() === "") {
      return NextResponse.json(
        { message: 'El email es obligatorio.' },
        { status: 400 }
      );
    }

    // [modificación] Variables para almacenar los datos del participante
    let participantId: string | undefined;
    let isNewParticipant = false;

    // [modificación] Buscar si el participante ya existe por email (si se proporcionó)
    if (email && email.trim() !== "") {
      const { data: existingParticipant, error: findError } = await supabaseAdmin
        .from('participants')
        .select('id, nombre, apellido, email')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116: No se encontraron filas
        console.error('Error al buscar participante:', findError);
        return NextResponse.json(
          { message: 'Error al buscar participante.', details: findError.message },
          { status: 500 }
        );
      }

      if (existingParticipant) {
        // [modificación] Usuario ya existe
        participantId = existingParticipant.id;
        console.log(`Participante existente encontrado: ${existingParticipant.nombre} (ID: ${participantId})`);
      } else {
        // [modificación] Nuevo usuario
        isNewParticipant = true;
      }
    } else {
      // [modificación] Si no hay email, es un nuevo usuario
      isNewParticipant = true;
    }

    // [modificación] Si es un nuevo participante, lo registramos
    if (isNewParticipant) {
      const { data: newParticipantData, error: insertError } = await supabaseAdmin
        .from('participants')
        .insert([
          {
            nombre: nombre.trim(),
            apellido: apellido ? apellido.trim() : null, // [modificación] - Apellido opcional
            email: email ? email.trim().toLowerCase() : null,
          },
        ])
        .select('id, nombre, apellido, email')
        .single();

      if (insertError) {
        console.error('Error al registrar nuevo participante:', insertError);
        return NextResponse.json(
          { message: 'Error al registrar nuevo participante.', details: insertError.message },
          { status: 500 }
        );
      }
      
      if (newParticipantData) {
        participantId = newParticipantData.id;
        console.log(`Nuevo participante registrado: ${newParticipantData.nombre} (ID: ${participantId})`);
      } else {
        return NextResponse.json(
          { message: 'Error al registrar participante: no se recibieron datos.' },
          { status: 500 }
        );
      }
    }

    // [modificación] Verificar que tenemos un ID de participante válido
    if (!participantId) {
      return NextResponse.json(
        { message: 'Error: No se pudo obtener un ID de participante válido.' },
        { status: 500 }
      );
    }

    // [modificación] Registrar la jugada en la tabla 'plays'
    const { data: playData, error: playInsertError } = await supabaseAdmin
      .from('plays')
      .insert([
        {
          participant_id: participantId,
          // created_at se llenará automáticamente por el default value 'now()'
        },
      ])
      .select()
      .single();

    if (playInsertError) {
      console.error('Error al registrar la jugada:', playInsertError);
      // Decidir si el error al registrar la jugada es crítico.
      // Si el participante ya existía o se creó, podríamos permitirle jugar igual.
      // return NextResponse.json(
      //   { message: 'Error al registrar la jugada.', details: playInsertError.message },
      //   { status: 500 }
      // );
    }

    // [modificación] Obtener los datos completos del participante
    const { data: participantDetails, error: getError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (getError) {
      console.error('Error al obtener detalles del participante:', getError);
      return NextResponse.json(
        { message: 'Error al obtener detalles del participante.', details: getError.message },
        { status: 500 }
      );
    }

    // [modificación] Obtener el conteo de jugadas del participante
    const { count: playCount, error: countError } = await supabaseAdmin
      .from('plays')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', participantId);

    if (countError) {
      console.error('Error al contar jugadas:', countError);
    }

    // [modificación] Añadir el conteo al objeto de participante
    const participantWithPlayCount = {
      ...participantDetails,
      play_count: playCount || 0
    };

    // [modificación] Respuesta exitosa
    return NextResponse.json({
      message: isNewParticipant ? 'Nuevo participante y jugada registrados' : 'Jugada registrada para participante existente',
      participant: participantWithPlayCount,
      play: playData,
    });

  } catch (err: any) {
    console.error('Error del servidor en handle-play-session:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', details: err.message },
      { status: 500 }
    );
  }
} 