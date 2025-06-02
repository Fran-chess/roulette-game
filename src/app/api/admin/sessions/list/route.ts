// src/app/api/admin/sessions/list/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Usamos supabaseAdmin para bypass RLS
import { getAuthenticatedAdminId } from '@/lib/adminAuth';

// Esta función manejará las solicitudes GET a /api/admin/sessions/list
export async function GET() {
  // Obtener el adminId autenticado a través de la cookie
  const adminId = await getAuthenticatedAdminId();

  if (!adminId) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  // Paso 3: Verificar que supabaseAdmin esté disponible (buena práctica).
  if (!supabaseAdmin) {
    console.error(
      'API /admin/sessions/list: supabaseAdmin no está disponible. Verifica la configuración.'
    );
    return NextResponse.json(
      { message: 'Error de configuración del servidor' },
      { status: 500 }
    );
  }

  try {
    // Paso 4: Consultar la base de datos usando supabaseAdmin.
    const { data, error } = await supabaseAdmin
      .from('plays') // Tu tabla se llama 'plays'
      .select('*')   // Selecciona todas las columnas de las sesiones, o especifica las que necesites
      .eq('admin_id', adminId) // Filtra por el admin_id del administrador actual
      .order('created_at', { ascending: false }); // Ordena las sesiones, por ejemplo, por fecha de creación

    // Paso 5: Manejar errores de la consulta a la base de datos.
    if (error) {
      console.error(
        'API /admin/sessions/list: Error al obtener las sesiones de juego:',
        error
      );
      return NextResponse.json(
        {
          message: 'Error al obtener las sesiones de juego',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // Paso 6: Devolver los datos encontrados (o un array vacío si no hay sesiones para ese admin).
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    // Paso 7: Manejar cualquier otra excepción inesperada.
    console.error(
      'API /admin/sessions/list: Excepción general en el endpoint:',
      err
    );

    // [modificación]: Normalizamos el mensaje de error
    let errorMessage = 'Error desconocido';           // [modificación]
    if (err instanceof Error) {                       // [modificación]
      errorMessage = err.message;                     // [modificación]
    }

    return NextResponse.json(
      {
        message: 'Error interno del servidor al obtener sesiones',
        details: errorMessage,                         // [modificación]
      },
      { status: 500 }
    );
  }
}
