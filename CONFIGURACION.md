# Configuración del Proyecto PWA - Roulette Game

## ⚠️ Configuración de Seguridad

### Variables de Entorno Seguras

Para que la aplicación PWA funcione correctamente con sincronización en tiempo real, necesitas configurar las siguientes variables de entorno en un archivo `.env.local` en la raíz del proyecto:

```env
# Variables de entorno para Supabase - REEMPLAZA CON TUS CREDENCIALES REALES
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio-de-supabase

# Variables adicionales de configuración
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 🔒 Obtener Credenciales de Forma Segura

**Paso a paso para configurar tus credenciales:**

1. **Accede a tu Dashboard de Supabase:**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto

2. **Obtén la URL del proyecto:**
   - Settings → API → Project URL
   - Copia: `https://[tu-proyecto-id].supabase.co`

3. **Obtén la clave anónima:**
   - Settings → API → Project API keys → `anon` `public`
   - Copia el token JWT

4. **Obtén la clave de servicio (OPCIONAL - solo para operaciones admin):**
   - Settings → API → Project API keys → `service_role` `secret`
   - ⚠️ **NUNCA expongas esta clave en código cliente**

### 🛡️ Mejores Prácticas de Seguridad

- ✅ **Archivo `.env.local`** está en `.gitignore` 
- ✅ **No commits credenciales** en código fuente
- ✅ **Variables de ejemplo** en documentación pública
- ✅ **RLS habilitado** en todas las tablas
- ✅ **Roles y permisos** configurados correctamente

**Información del Proyecto (información general - no sensible):**
- **Región**: sa-east-1 (South America - São Paulo)
- **Estado**: ACTIVE_HEALTHY  
- **Base de Datos**: PostgreSQL 15.8.1.085

## Configuración de la Base de Datos

### Tabla `admin_users` ✅ CONFIGURADA

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,                    
  password TEXT NOT NULL,                        
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

**Estado actual**: 2 usuarios registrados
- `admin_prueba@hotmail.com` - "Admin de prueba"
- `admin@darsalud.com` - "AdminPrueba"

### Tabla `plays` ✅ CONFIGURADA

```sql
CREATE TABLE plays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,                      
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  admin_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, 
  participant_id TEXT,                           
  status TEXT DEFAULT 'pending_player_registration' NOT NULL,
  nombre TEXT,
  apellido TEXT,
  email TEXT,
  especialidad TEXT,
  admin_id UUID REFERENCES admin_users(id),     
  score INTEGER,
  premio_ganado TEXT,
  detalles_juego JSONB,
  lastquestionid TEXT,                           
  answeredcorrectly BOOLEAN                      
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;

-- Crear índices para optimización
CREATE INDEX idx_plays_participant_id ON plays (participant_id);
CREATE INDEX idx_plays_created_at ON plays (created_at);
CREATE INDEX idx_plays_session_id ON plays (session_id);

-- Foreign Key Constraints
ALTER TABLE plays ADD CONSTRAINT plays_admin_id_fkey 
  FOREIGN KEY (admin_id) REFERENCES admin_users(id);
ALTER TABLE plays ADD CONSTRAINT fk_admin_user 
  FOREIGN KEY (admin_id) REFERENCES admin_users(id);
```

**Estado actual**: 2 registros en estado "pending_player_registration"

## Configuración de Autenticación

### Sistema de Autenticación Personalizado

El proyecto utiliza un sistema de autenticación personalizado con:
- **Encriptación**: bcrypt para passwords
- **Extensión**: pgcrypto habilitada
- **Funciones**: Funciones personalizadas para login y registro

### Usuarios Configurados

Los siguientes usuarios están disponibles en la base de datos:

1. **Admin Principal**: `admin@darsalud.com` - Para el panel de administración (tablet)
2. **Admin de Prueba**: `admin_prueba@hotmail.com` - Usuario de testing

### Configuración de Roles

Los roles se determinan automáticamente por el email:
- Emails que contengan "admin" → Rol: admin (acceso al panel de administración)
- Otros emails → Rol: viewer (pantalla de TV)

## Características PWA

### Instalación
- La aplicación se puede instalar en tablets y TVs
- Funciona en modo kiosk (pantalla completa)
- Funciona offline una vez instalada

### Dispositivos de Presentación Optimizados
La aplicación está diseñada específicamente para:

#### **Tablet 10″ Android (16:10) - Panel Admin**
- **Landscape**: 1920×1200 px
- **Portrait**: 1200×1920 px
- **Función**: Control y gestión del juego

#### **iPad 9.7″ Retina (4:3) - Panel Admin**
- **Landscape**: 2048×1536 px  
- **Portrait**: 1536×2048 px
- **Función**: Control y gestión del juego

#### **TV Táctil 65″ (4K, 16:9) - Pantalla de Visualización**
- **Landscape**: 3840×2160 px
- **Portrait**: 2160×3840 px
- **Función**: Visualización para participantes y audiencia

### Sincronización en Tiempo Real ✅ HABILITADA
- **Realtime habilitado** en Supabase
- Tablet (admin) y TV se sincronizan instantáneamente
- Los cambios se reflejan en milisegundos
- Estado persistente entre dispositivos
- RLS (Row Level Security) configurado para seguridad

## Flujo de Uso

1. **Admin** inicia sesión en tablet → Ve panel de administración
2. **TV** → Ve pantalla de espera
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

## Configuración de Seguridad

### Row Level Security (RLS)
- **Habilitado** en ambas tablas (`admin_users` y `plays`)
- Políticas de seguridad configuradas
- Acceso controlado por roles

### Encriptación
- Passwords encriptados con **bcrypt**
- Extensión **pgcrypto** habilitada
- Claves UUID generadas automáticamente

### Constraints de Integridad
- Foreign Keys configuradas correctamente
- Constraints únicos en emails
- Validaciones de datos

## Estado del Proyecto

### Base de Datos
- ✅ **Estado**: Saludable y operativa
- ✅ **Realtime**: Habilitado
- ✅ **Migraciones**: 20 aplicadas exitosamente
- ✅ **Seguridad**: RLS y encriptación configurados
- ✅ **Datos**: Usuarios y sesiones de prueba disponibles

### Funcionalidades
- ✅ **Autenticación**: Sistema personalizado funcionando
- ✅ **Sesiones**: Manejo de sesiones de juego
- ✅ **Sincronización**: Tiempo real entre dispositivos
- ✅ **PWA**: Configuración lista para producción

**Nota**: next-pwa está configurado para generar automáticamente el service worker solo en producción. En desarrollo está deshabilitado para mejor rendimiento de desarrollo. 