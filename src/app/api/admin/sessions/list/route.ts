// src/app/api/admin/sessions/list/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Usamos supabaseAdmin para bypass RLS

// Esta función manejará las solicitudes GET a /api/admin/sessions/list
export async function GET(request: Request) {
  // Paso 1: Obtener el adminId del administrador que hace la solicitud.
  // El frontend (AdminPanel.tsx) enviará el adminId como un parámetro de búsqueda en la URL.
  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get('adminId');

  // Paso 2: Validar que se proporcionó el adminId.
  if (!adminId) {
    return NextResponse.json({ message: 'Admin ID es requerido en los parámetros de la URL' }, { status: 400 });
  }

  // Paso 3: Verificar que supabaseAdmin esté disponible (buena práctica).
  if (!supabaseAdmin) {
    console.error('API /admin/sessions/list: supabaseAdmin no está disponible. Verifica la configuración.');
    return NextResponse.json({ message: 'Error de configuración del servidor' }, { status: 500 });
  }

  try {
    // Paso 4: Consultar la base de datos usando supabaseAdmin.
    // supabaseAdmin omite las RLS, por lo que puede leer todas las filas.
    // Filtramos por el admin_id proporcionado para obtener solo las sesiones de ese admin.
    const { data, error } = await supabaseAdmin
      .from('plays') // Tu tabla se llama 'plays'
      .select('*')   // Selecciona todas las columnas de las sesiones, o especifica las que necesites
      .eq('admin_id', adminId) // Filtra por el admin_id del administrador actual
      .order('created_at', { ascending: false }); // Ordena las sesiones, por ejemplo, por fecha de creación

    // Paso 5: Manejar errores de la consulta a la base de datos.
    if (error) {
      console.error('API /admin/sessions/list: Error al obtener las sesiones de juego:', error);
      return NextResponse.json({ message: 'Error al obtener las sesiones de juego', details: error.message }, { status: 500 });
    }

    // Paso 6: Devolver los datos encontrados (o un array vacío si no hay sesiones para ese admin).
    // Asegúrate de que la estructura de 'data' coincida con tu interfaz PlaySession en el frontend.
    return NextResponse.json(data || []); 
  } catch (err: any) {
    // Paso 7: Manejar cualquier otra excepción inesperada.
    console.error('API /admin/sessions/list: Excepción general en el endpoint:', err);
    return NextResponse.json({ message: 'Error interno del servidor al obtener sesiones', details: err.message }, { status: 500 });
  }
}