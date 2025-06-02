import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';

export async function GET() {
  try {
    const adminId = await getAuthenticatedAdminId();
    if (!adminId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      console.error('Error: supabaseAdmin no disponible');
      return NextResponse.json({ message: 'Error de configuracion' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, name')
      .eq('id', adminId)
      .single();

    if (error || !data) {
      console.error('Error obteniendo admin:', error);
      return NextResponse.json({ message: 'Admin no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ admin: data });
  } catch (err) {
    console.error('Error en admin/profile:', err);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
