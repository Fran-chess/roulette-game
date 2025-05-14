# Configuración del Proyecto

## Configuración de Supabase

Para que la aplicación funcione correctamente, necesitas crear un proyecto en Supabase y configurar las siguientes variables de entorno en un archivo `.env.local` en la raíz del proyecto:

```
# Variables de entorno para Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio-de-supabase
```

### Pasos para configurar Supabase:

1. Crea una cuenta en [Supabase](https://supabase.com) si aún no tienes una.
2. Crea un nuevo proyecto.
3. Una vez creado el proyecto, ve a Configuración > API para obtener las credenciales.
4. Copia la URL del proyecto y la clave anónima en las variables de entorno correspondientes.
5. También necesitarás la clave de servicio (service role key) para operaciones administrativas.

## Configuración de la Base de Datos

Necesitas crear las siguientes tablas en Supabase:

### Tabla `participants`

```sql
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nombre TEXT NOT NULL,
  apellido TEXT,
  email TEXT,
  especialidad TEXT,
  lastQuestionId TEXT,
  answeredCorrectly BOOLEAN,
  prizeWon TEXT
);

-- Crear un índice en el email para búsquedas más rápidas
CREATE INDEX idx_participants_email ON participants (email);
```

### Tabla `plays`

```sql
CREATE TABLE plays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  participant_id UUID,
  status TEXT DEFAULT 'pending_player_registration',
  nombre TEXT,
  apellido TEXT,
  email TEXT,
  especialidad TEXT,
  admin_id UUID,
  score INTEGER,
  premio_ganado TEXT,
  detalles_juego JSONB
);

-- Crear índice para búsquedas de jugadas por participante
CREATE INDEX idx_plays_participant_id ON plays (participant_id);
-- Crear índice para filtros por fecha
CREATE INDEX idx_plays_created_at ON plays (created_at);
-- Crear índice para búsquedas por session_id
CREATE INDEX idx_plays_session_id ON plays (session_id);
```

## Ejecución del Proyecto

Una vez configuradas las variables de entorno y la base de datos, puedes ejecutar el proyecto con:

```bash
npm run dev
```

O para producción:

```bash
npm run build
npm start
``` 