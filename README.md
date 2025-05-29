# Roulette Game - Juego Interactivo PWA

Una aplicación web progresiva (PWA) para juegos interactivos con sincronización en tiempo real entre tablet (administrador) y TV (visualización).

## 🚀 Características Principales

### PWA (Progressive Web App)
- **Instalable** en tablets y TVs
- **Modo kiosk** (pantalla completa sin barra de URL)
- **Funciona offline** una vez instalada
- **Arranque rápido** con prerenderizado

### Sincronización en Tiempo Real
- **Supabase Realtime** para sincronización instantánea
- **Tablet (Admin)** y **TV** conectados en milisegundos
- **Estado persistente** entre dispositivos
- **Actualizaciones automáticas** sin recargar página

### Arquitectura Basada en Roles
- **Admin** (tablet): Panel de control y gestión - **Requiere autenticación**
- **Viewer** (TV): Pantallas de visualización - **Acceso directo sin login**
- **Autenticación personalizada** con bcrypt para admin
- **Rutas protegidas** según rol

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Next.js 15** con App Router
- **Supabase** para backend y realtime
- **Zustand** para gestión de estado
- **Framer Motion** para animaciones
- **Tailwind CSS** para estilos
- **TypeScript** para tipado

### Flujo de Datos
```
Tablet (Admin) → Supabase (tabla plays) → TV (Viewer)
     ↓                    ↓                     ↓
  Crear sesión → Realtime subscription → Mostrar invitación
  Registrar → Actualizar estado → Mostrar juego activo
  Completar → Sincronizar resultado → Mostrar resultados
```

## 📱 Estados de la Aplicación

### Pantallas de TV
1. **Waiting**: Esperando nueva sesión
2. **Invitation**: Invitación a participar
3. **Active**: Juego en curso con jugador actual
4. **Completed**: Resultados y celebración

### Panel de Admin
- Dashboard con sesiones activas
- Registro de participantes
- Control de estado del juego
- Historial de sesiones

## 🛠️ Configuración

### 1. Variables de Entorno
Crear `.env.local` en la raíz:
```env
# Variables de entorno para Supabase - Proyecto: roulette-game
NEXT_PUBLIC_SUPABASE_URL=https://yinhukkubomcyolkrahg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpbmh1a2t1Ym9tY3lvbGtyYWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MTUyNzIsImV4cCI6MjA2MjI5MTI3Mn0.Bj3CAHgAjenFDoaxbLprlBAHcMyDffbtcHhGOQxu0Mc
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio-de-supabase
```

### 2. Base de Datos ✅ CONFIGURADA
La base de datos ya está completamente configurada con:
- **20 migraciones aplicadas** exitosamente
- **Tablas**: `admin_users` y `plays` con todas las columnas necesarias
- **RLS habilitado** para seguridad
- **Realtime habilitado** para sincronización
- **Usuarios de prueba** ya creados

### 3. Usuarios Disponibles
Los siguientes usuarios están configurados en la base de datos:
- `admin@darsalud.com` - Admin principal
- `admin_prueba@hotmail.com` - Admin de prueba

## 🚀 Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 📋 Flujo de Uso

1. **Setup Inicial**
   - Admin inicia sesión en tablet con email/password
   - TV accede directamente a /tv sin login

2. **Inicio de Sesión**
   - Admin crea nueva sesión en tabla `plays`
   - TV automáticamente muestra invitación via realtime

3. **Registro de Participante**
   - Admin registra jugador en tablet
   - TV muestra información del jugador

4. **Juego Activo**
   - Admin controla el juego
   - TV muestra progreso en tiempo real

5. **Finalización**
   - TV muestra resultados
   - Sistema listo para siguiente jugador

## 🔧 Desarrollo

### Estructura de Archivos
```
src/
├── app/                 # Rutas de Next.js
│   ├── admin/          # Panel de administración (requiere auth)
│   ├── tv/             # Vista de televisión (acceso directo)
│   └── layout.tsx      # Layout principal con PWA
├── components/
│   ├── auth/           # Autenticación (solo admin)
│   ├── tv/             # Componentes de TV
│   ├── admin/          # Componentes de admin
│   └── layout/         # Layout y navegación
├── store/
│   └── sessionStore.ts # Estado global con Zustand
└── types/              # Tipos TypeScript
```

### Comandos Útiles
```bash
# Linting
npm run lint

# Desarrollo con Turbopack
npm run dev --turbo

# Análisis de bundle
npm run analyze
```

## 🔒 Seguridad

- **Row Level Security** habilitado en Supabase
- **Autenticación personalizada** con bcrypt
- **Políticas de acceso** por usuario
- **Validación de roles** en frontend
- **Sanitización** de datos de entrada

## 📊 Estado del Proyecto

### Base de Datos ✅
- **Estado**: Saludable y operativa
- **Realtime**: Habilitado
- **Migraciones**: 20 aplicadas exitosamente
- **Seguridad**: RLS y encriptación configurados
- **Datos**: Usuarios y sesiones de prueba disponibles

### Funcionalidades ✅
- **Autenticación**: Sistema personalizado funcionando
- **Sesiones**: Manejo de sesiones de juego en tabla `plays`
- **Sincronización**: Tiempo real entre dispositivos
- **PWA**: Configuración lista para producción

## 🎯 Optimizaciones PWA

- **Prerenderizado parcial** (PPR)
- **Compresión** habilitada
- **Headers de seguridad** configurados
- **Service Worker** para cache inteligente
- **Manifest** optimizado para instalación

## 📱 Compatibilidad

### Dispositivos de Presentación
La aplicación está optimizada para los siguientes dispositivos específicos:

#### **Tablet 10″ Android (16:10)**
- **Landscape**: 1920×1200 px
- **Portrait**: 1200×1920 px
- **Uso**: Panel de administración (Admin)

#### **iPad 9.7″ Retina (4:3)**
- **Landscape**: 2048×1536 px  
- **Portrait**: 1536×2048 px
- **Uso**: Panel de administración (Admin)

#### **TV Táctil 65″ (4K, 16:9)**
- **Landscape**: 3840×2160 px
- **Portrait**: 2160×3840 px
- **Uso**: Pantalla de visualización (Viewer)

### Navegadores Compatibles
- **Chrome, Safari, Edge, Firefox**
- **Orientación**: Landscape optimizado para mejor experiencia
- **PWA**: Instalable en todos los dispositivos mencionados

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crear issue en GitHub
- Revisar documentación en `CONFIGURACION.md` y `FLUJO_COMPLETO.md`
- Consultar logs en Supabase Dashboard

---

**Roulette Game** - Aplicación PWA con sincronización en tiempo real 🚀
