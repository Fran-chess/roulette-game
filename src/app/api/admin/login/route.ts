import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Endpoint para iniciar sesión como administrador
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validar campos obligatorios
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que supabaseAdmin no sea nulo
    if (!supabaseAdmin) {
      console.error('Error: supabaseAdmin no está disponible, verifica la configuración de variables de entorno');
      return NextResponse.json(
        { message: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Verificar credenciales usando la función de PostgreSQL
    const { data, error } = await supabaseAdmin.rpc('verify_admin_credentials', {
      admin_email: email,
      admin_password: password
    });

    if (error) {
      console.error('Error al verificar credenciales:', error);
      return NextResponse.json(
        { message: 'Error al verificar credenciales' },
        { status: 500 }
      );
    }

    // No se encontró usuario con esas credenciales
    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Devolver datos del administrador (sin incluir la contraseña)
    const admin = data[0];
    
    return NextResponse.json({
      message: 'Inicio de sesión exitoso',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (err: any) {
    console.error('Error en el inicio de sesión:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 