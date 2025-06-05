import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdminId } from '@/lib/adminAuth';

// Interfaz para los datos de migración desde plays
interface PlayMigrationData {
  session_id: string;
  admin_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Endpoint para crear la tabla game_sessions si no existe
 * Este endpoint solo debería ejecutarse una vez para configurar la estructura correcta
 */
export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Error en la conexión con la base de datos' },
        { status: 500 }
      );
    }

    const adminId = await getAuthenticatedAdminId();
    if (!adminId) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('🚀 Configurando tabla game_sessions...');

    // SQL para crear la tabla game_sessions
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.game_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending_player_registration' 
          CHECK (status IN ('pending_player_registration', 'player_registered', 'playing', 'completed', 'archived')),
        participant_id UUID,
        game_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Crear índices para optimización
      CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id ON public.game_sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_game_sessions_admin_id ON public.game_sessions(admin_id);
      CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON public.game_sessions(created_at);

      -- Habilitar RLS (Row Level Security)
      ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

      -- Crear política de seguridad para que los admins solo vean sus propias sesiones
      DROP POLICY IF EXISTS "Los admins solo pueden ver sus propias sesiones" ON public.game_sessions;
      CREATE POLICY "Los admins solo pueden ver sus propias sesiones" ON public.game_sessions
        FOR ALL USING (admin_id = auth.uid());

      -- NUEVA POLÍTICA: Permitir lectura pública para TV (sin autenticación)
      DROP POLICY IF EXISTS "TV puede leer sesiones públicamente" ON public.game_sessions;
      CREATE POLICY "TV puede leer sesiones públicamente" ON public.game_sessions
        FOR SELECT USING (true);

      -- Habilitar realtime para la tabla
      ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
    `;

    // Ejecutar la creación de la tabla
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: createTableSQL
    });

    if (createError) {
      console.error('Error al crear tabla game_sessions:', createError);
      
      // Intentar método alternativo si el RPC falla
      try {
        const { error: directError } = await supabaseAdmin
          .from('game_sessions')
          .select('id')
          .limit(1);

        if (directError && directError.code === '42P01') {
          // Tabla no existe, usar SQL directo
          const { error: sqlError } = await supabaseAdmin.rpc('exec', {
            sql: createTableSQL
          });

          if (sqlError) {
            throw sqlError;
          }
        }
      } catch (alternativeError) {
        console.error('Error en método alternativo:', alternativeError);
        return NextResponse.json(
          { 
            message: 'Error al crear tabla game_sessions',
            error: createError.message,
            details: 'Es posible que necesites crear la tabla manualmente desde el panel de Supabase'
          },
          { status: 500 }
        );
      }
    }

    // Verificar que la tabla existe haciendo una consulta simple
    const { error: checkError } = await supabaseAdmin
      .from('game_sessions')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      return NextResponse.json(
        { 
          message: 'Tabla game_sessions no existe',
          error: 'La tabla necesita ser creada manualmente',
          sqlToExecute: createTableSQL
        },
        { status: 500 }
      );
    }

    console.log('✅ Tabla game_sessions configurada correctamente');

    // Verificar si hay sesiones que necesitan ser migradas desde plays
    const { data: playsData, error: playsError } = await supabaseAdmin
      .from('plays')
      .select('session_id, admin_id, status, created_at, updated_at')
      .not('session_id', 'is', null)
      .order('created_at', { ascending: false })
      .returns<PlayMigrationData[]>();

    if (playsError) {
      console.warn('No se pudieron verificar datos en plays:', playsError);
    }

    let migratedCount = 0;
    if (playsData && playsData.length > 0) {
      console.log(`📋 Encontradas ${playsData.length} sesiones en tabla plays que podrían ser migradas`);

      // Agrupar por session_id para evitar duplicados
      const uniqueSessions = new Map<string, PlayMigrationData>();
      playsData.forEach((play: PlayMigrationData) => {
        if (!uniqueSessions.has(play.session_id) || 
            (uniqueSessions.get(play.session_id)!.created_at < play.created_at)) {
          uniqueSessions.set(play.session_id, play);
        }
      });

      // Migrar cada sesión única
      for (const [sessionId, sessionData] of uniqueSessions.entries()) {
        try {
          const { error: insertError } = await supabaseAdmin
            .from('game_sessions')
            .insert({
              session_id: sessionId,
              admin_id: sessionData.admin_id,
              status: sessionData.status || 'pending_player_registration',
              created_at: sessionData.created_at,
              updated_at: sessionData.updated_at || sessionData.created_at
            });

          if (insertError && insertError.code !== '23505') { // Ignorar duplicados
            console.warn(`Error migrando sesión ${sessionId}:`, insertError);
          } else if (!insertError) {
            migratedCount++;
          }
        } catch (migrationError) {
          console.warn(`Error migrando sesión ${sessionId}:`, migrationError);
        }
      }

      console.log(`✅ Migradas ${migratedCount} sesiones únicas de plays a game_sessions`);
    }

    return NextResponse.json({
      message: 'Tabla game_sessions configurada exitosamente',
      tableExists: true,
      migratedSessions: migratedCount,
      sqlExecuted: createTableSQL,
      instructions: {
        next: 'Ahora puedes usar los endpoints corregidos que usan game_sessions',
        playsTable: 'La tabla plays debe usarse solo para registrar jugadas individuales'
      }
    });

  } catch (err: unknown) {
    console.error('❌ Error configurando game_sessions:', err);
    return NextResponse.json(
      { 
        message: 'Error interno del servidor',
        error: err instanceof Error ? err.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 