import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';
// [modificación] Importar funciones helper que manejan UUID correctamente
import { validateUUID, upsertSessionParticipant } from '@/lib/supabaseHelpers';

// [modificación] Definir interface para el participante devuelto por la función RPC
interface ParticipantData {
  id: string;
  session_id: string;
  nombre: string;
  apellido?: string;
  email: string;
  especialidad?: string;
  participant_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Endpoint para registrar un jugador en una sesión usando estructura sessions + plays
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
    console.log(`📱 REGISTER: Recibida solicitud de registro para sesión: ${sessionId}`);
    console.log(`👤 REGISTER: Participante: ${nombre} ${apellido || ''} (${email})`);
    console.log(`🏥 REGISTER: Especialidad: ${especialidad || 'N/A'}`);

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

    // [modificación] Validar que sessionId sea un UUID válido
    try {
      validateUUID(sessionId);
    } catch (error) {
      console.error('❌ REGISTER: sessionId no es un UUID válido:', sessionId, error);
      return NextResponse.json(
        { message: 'ID de sesión inválido' },
        { status: 400 }
      );
    }

    // [modificación] Verificar que la sesión existe antes de registrar el participante
    console.log(`🔍 REGISTER: Verificando existencia de sesión ${sessionId}...`);
    
    const { data: existingSession, error: sessionError } = await supabaseAdmin
      .from('plays')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('❌ REGISTER: Error al buscar sesión existente:', sessionError);
      return NextResponse.json(
        { message: 'Error al verificar la sesión', error: sessionError.message },
        { status: 500 }
      );
    }

    if (!existingSession) {
      console.error(`❌ REGISTER: Sesión ${sessionId} no encontrada`);
      return NextResponse.json(
        { message: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    console.log(`✅ REGISTER: Sesión encontrada - Estado actual: ${existingSession.status}`);
    console.log(`🔗 REGISTER: Admin ID de la sesión: ${existingSession.admin_id}`);

    // [modificación] Usar función helper que maneja UUID correctamente en lugar de RPC
    console.log(`🔄 REGISTER: Registrando participante usando función helper optimizada...`);
    
    try {
      const participantData = await upsertSessionParticipant(
        sessionId, // Ya validado como UUID
        nombre,
        apellido || null,
        email,
        especialidad || null
      );

      // [modificación] Validación de tipo segura para participantData
      if (!participantData || !Array.isArray(participantData) || participantData.length === 0) {
        console.error('❌ REGISTER: No se recibieron datos del participante registrado');
        return NextResponse.json(
          { message: 'Error al procesar registro del participante' },
          { status: 500 }
        );
      }

      // [modificación] Cast seguro con validación
      const registeredParticipant = participantData[0] as unknown as ParticipantData;
      
      // Validar que los datos esenciales estén presentes
      if (!registeredParticipant.id || !registeredParticipant.session_id) {
        console.error('❌ REGISTER: Datos del participante incompletos:', registeredParticipant);
        return NextResponse.json(
          { message: 'Error: datos del participante incompletos' },
          { status: 500 }
        );
      }

      // [modificación] Validar que el session_id devuelto sea un UUID válido
      try {
        validateUUID(registeredParticipant.session_id);
      } catch (error) {
        console.error('❌ REGISTER: session_id devuelto no es UUID válido:', registeredParticipant.session_id, error);
        return NextResponse.json(
          { message: 'Error: ID de sesión devuelto inválido' },
          { status: 500 }
        );
      }
      
      console.log(`✅ REGISTER: Participante registrado exitosamente:`);
      console.log(`   ID: ${registeredParticipant.id}`);
      console.log(`   Participant ID: ${registeredParticipant.participant_id}`);
      console.log(`   Estado: ${registeredParticipant.status}`);
      console.log(`   Session ID: ${registeredParticipant.session_id}`);

      // [modificación] Verificación adicional para asegurar que el cambio se propagó
      console.log('🔍 REGISTER: Verificando que el cambio se aplicó correctamente...');
      
      const { data: verificationData, error: verificationError } = await supabaseAdmin
        .from('plays')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'player_registered')
        .single();

      if (verificationError) {
        console.warn('⚠️ REGISTER: No se pudo verificar el registro, pero puede haber sido exitoso:', verificationError);
      } else {
        console.log(`✅ REGISTER: Verificación exitosa - Participante: ${verificationData.nombre} está registrado`);
      }

      // [modificación] Respuesta exitosa con datos completos del participante
      return NextResponse.json({
        message: 'Participante registrado exitosamente',
        success: true,
        sessionId: sessionId,
        participant: {
          id: registeredParticipant.id,
          participantId: registeredParticipant.participant_id,
          nombre: registeredParticipant.nombre,
          apellido: registeredParticipant.apellido,
          email: registeredParticipant.email,
          especialidad: registeredParticipant.especialidad,
          status: registeredParticipant.status,
          createdAt: registeredParticipant.created_at,
          updatedAt: registeredParticipant.updated_at
        }
      });

    } catch (upsertError) {
      console.error('❌ REGISTER: Error en upsertSessionParticipant helper:', upsertError);
      return NextResponse.json(
        { message: 'Error al registrar participante', error: upsertError instanceof Error ? upsertError.message : 'Error desconocido' },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error('❌ REGISTER: Error general en el endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { 
        message: 'Error interno del servidor',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
} 
