# Configuración del Proyecto PWA - DarSalud

## Configuración de Supabase

Para que la aplicación PWA funcione correctamente con sincronización en tiempo real, necesitas crear un proyecto en Supabase y configurar las siguientes variables de entorno en un archivo `.env.local` en la raíz del proyecto:

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

Ejecuta el archivo `DATABASE_MIGRATION.sql` en el editor SQL de Supabase para crear todas las tablas necesarias.

### Tablas requeridas:

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

### Tabla `game_sessions` (Nueva)

```sql
-- Esta tabla se crea automáticamente ejecutando DATABASE_MIGRATION.sql
-- Gestiona las sesiones de juego con sincronización en tiempo real
-- Estados: waiting, player_registration, active, completed, paused
```

## Configuración de Autenticación

### Usuarios de Prueba

Crea los siguientes usuarios en Supabase Auth:

1. **Admin**: `admin@darsalud.com` - Para el panel de administración (tablet)
2. **TV**: `tv@darsalud.com` - Para la vista de televisión

### Configuración de Roles

Los roles se determinan automáticamente por el email:
- Emails que contengan "admin" → Rol: admin
- Otros emails → Rol: viewer (TV)

## Características PWA

### Instalación
- La aplicación se puede instalar en tablets y TVs
- Funciona en modo kiosk (pantalla completa)
- Funciona offline una vez instalada

### Sincronización en Tiempo Real
- Tablet (admin) y TV se sincronizan instantáneamente
- Los cambios se reflejan en milisegundos
- Estado persistente entre dispositivos

## Flujo de Uso

1. **Admin** inicia sesión en tablet → Ve panel de administración
2. **TV** inicia sesión → Ve pantalla de espera
3. **Admin** crea/activa sesión → TV muestra invitación a jugar
4. **Admin** registra participante → TV muestra juego activo
5. **Jugador** completa → TV muestra resultados
6. **Proceso** se repite para siguiente jugador

## Ejecución del Proyecto

### Instalación de Dependencias

```bash
# Instalar dependencias base
npm install

# Instalar next-pwa para funcionalidad PWA
npm install next-pwa
```

### Desarrollo y Producción

```bash
# Desarrollo (PWA deshabilitado para mejor rendimiento)
npm run dev

# Producción (PWA habilitado)
npm run build
npm start
```

**Nota**: next-pwa está configurado para generar automáticamente el service worker solo en producción. En desarrollo está deshabilitado para mejor rendimiento de desarrollo.