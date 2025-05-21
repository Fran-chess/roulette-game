import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isPlayerRegistered } from '@/utils/session';

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

    // Verificación más flexible de la sesión
    // Primero intentamos verificar directamente por ID
    let { data: sessionData, error: sessionFetchError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
      
    // Si encontramos la sesión, verificar que no tenga ya un jugador registrado
    if (sessionData) {
      if (isPlayerRegistered(sessionData)) {
        return NextResponse.json(
          { 
            message: 'Esta sesión ya tiene un jugador registrado', 
            error: 'PLAYER_ALREADY_REGISTERED',
            session: sessionData
          },
          { status: 409 } // Conflict
        );
      }
      
      // Verificar que el estado sea adecuado para registro
      if (sessionData.status !== 'pending_player_registration') {
        console.log(`Advertencia: Registro en sesión con estado ${sessionData.status}`);
      }
    }
      
    // Si hay un error o no encontramos la sesión, verificamos su existencia con RPC
    if (sessionFetchError || !sessionData) {
      console.log('No se encontró la sesión directamente, verificando con RPC...');
      
      try {
        const { data: checkData, error: checkError } = await supabaseAdmin.rpc(
          'check_session_exists',
          { session_id_param: sessionId }
        );
        
        if (checkError) {
          console.error('Error al verificar sesión con RPC:', checkError);
          return NextResponse.json(
            { message: 'Error al verificar la sesión en la base de datos', error: checkError.message },
            { status: 500 }
          );
        }
        
        if (!checkData) {
          return NextResponse.json(
            { message: 'Sesión no encontrada. Verifica el ID de la sesión.' },
            { status: 404 }
          );
        }
        
        // Si llegamos aquí, la sesión existe pero no pudimos acceder directamente
        // Creamos una sesión desde cero
        console.log('Sesión verificada mediante RPC, intentando crear/actualizar registro...');
        
        // Intentar insertar un registro para esta sesión si no existe
        const { data: createdSession, error: createError } = await supabaseAdmin
          .from('plays')
          .upsert({
            session_id: sessionId,
            status: 'pending_player_registration',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            admin_id: 'auto_created' // Valor temporal para indicar que fue creado automáticamente
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error al crear registro de sesión:', createError);
          return NextResponse.json(
            { message: 'Error al crear registro para la sesión existente', error: createError.message },
            { status: 500 }
          );
        }
        
        sessionData = createdSession;
      } catch (rpcError: any) {
        console.error('Error en verificación RPC:', rpcError);
        return NextResponse.json(
          { message: 'Error en la verificación RPC', error: rpcError.message },
          { status: 500 }
        );
      }
    }
    
    // Segunda verificación por seguridad tras posible creación
    if (sessionData && isPlayerRegistered(sessionData)) {
      return NextResponse.json(
        { 
          message: 'Esta sesión ya tiene un jugador registrado', 
          error: 'PLAYER_ALREADY_REGISTERED',
          session: sessionData 
        },
        { status: 409 } // Conflict
      );
    }

    // Crear un ID único para el participante
    const participantId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Actualizar la sesión con los datos del jugador
    const updateData = {
      nombre,
      apellido: apellido || null,
      email,
      especialidad: especialidad || null,
      participant_id: participantId,
      status: 'player_registered',
      updated_at: new Date().toISOString()
    };
    
    console.log('Actualizando sesión con datos:', updateData);

    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('plays')
      .update(updateData)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error al registrar jugador:', updateError);
      return NextResponse.json(
        { message: 'Error al registrar jugador en la sesión', error: updateError.message },
        { status: 500 }
      );
    }

    // También intentamos insertar en caso de que la actualización no funcione
    if (!updatedSession) {
      console.log('No se pudo actualizar la sesión, intentando insertar...');
      
      const { data: insertedSession, error: insertError } = await supabaseAdmin
        .from('plays')
        .insert({
          session_id: sessionId,
          ...updateData
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Error al insertar datos de jugador:', insertError);
        return NextResponse.json(
          { message: 'Error al insertar datos del jugador', error: insertError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: 'Jugador registrado exitosamente (inserción)',
        session: insertedSession || null
      });
    }

    return NextResponse.json({
      message: 'Jugador registrado exitosamente',
      session: updatedSession || null
    });
  } catch (err: any) {
    console.error('Error en el registro de jugador:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: err.message },
      { status: 500 }
    );
  }
} 