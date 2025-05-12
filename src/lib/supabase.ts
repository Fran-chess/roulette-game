// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// [modificación] Variables de entorno para la conexión con Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// [modificación] Cliente para uso en el lado del cliente (autenticación anónima)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// [modificación] Cliente con rol de servicio para operaciones administrativas en API Routes
// IMPORTANTE: Este cliente NUNCA debe usarse en componentes del cliente, solo en API Routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// [modificación] Exportamos tipos básicos de Supabase
export type { SupabaseClient } from '@supabase/supabase-js';