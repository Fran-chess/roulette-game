import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/adminAuth';

export async function POST() {
  try {
    await clearAdminCookie();
    return NextResponse.json({ message: 'Cierre de sesión exitoso' });
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
