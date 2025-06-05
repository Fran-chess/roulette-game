import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from './lib/adminAuth';

/**
 * Rutas que requieren autenticación de admin
 */
const PROTECTED_ADMIN_ROUTES = [
  '/api/admin/sessions',
  '/api/admin/profile',
  '/api/admin/participants',
];

/**
 * Rutas públicas de admin (login, etc.)
 */
const PUBLIC_ADMIN_ROUTES = [
  '/api/admin/login',
  '/api/admin/logout',
];

/**
 * Middleware para gestión segura de autenticación de admin
 * Valida cookies HTTP Only en cada request a rutas protegidas
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (!pathname.startsWith('/api/admin/')) {
    return NextResponse.next();
  }
  
  if (PUBLIC_ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  if (PROTECTED_ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('admin-token')?.value;
    const adminId = await verifyAdminToken(token);
    
    if (!adminId) {
      console.log(`🔒 Acceso denegado a ${pathname} - Token inválido o expirado`);
      return NextResponse.json(
        { message: 'No autorizado - Sesión expirada' },
        { status: 401 }
      );
    }
    
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-id', adminId);
    
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*',
  ],
}; 