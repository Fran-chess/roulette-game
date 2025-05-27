# DarSalud - Juego Interactivo PWA

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
- **Admin** (tablet): Panel de control y gestión
- **Viewer** (TV): Pantallas de visualización
- **Autenticación automática** por email
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
Tablet (Admin) → Supabase → TV (Viewer)
     ↓              ↓           ↓
  Crear sesión → Realtime → Mostrar invitación
  Registrar → Actualizar → Mostrar juego activo
  Completar → Sincronizar → Mostrar resultados
```

## 📱 Estados de la Aplicación

### Pantallas de TV
1. **Waiting**: Pantalla de espera con reloj
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
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio
```

### 2. Base de Datos
Ejecutar `DATABASE_MIGRATION.sql` en Supabase SQL Editor.

### 3. Usuarios de Prueba
Crear en Supabase Auth:
- `admin@darsalud.com` (rol: admin)
- `tv@darsalud.com` (rol: viewer)

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
   - Admin inicia sesión en tablet
   - TV inicia sesión y muestra pantalla de espera

2. **Inicio de Sesión**
   - Admin crea nueva sesión
   - TV automáticamente muestra invitación

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
│   ├── admin/          # Panel de administración
│   ├── tv/             # Vista de televisión
│   └── layout.tsx      # Layout principal con PWA
├── components/
│   ├── auth/           # Autenticación
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

- **Row Level Security** en Supabase
- **Políticas de acceso** por usuario
- **Validación de roles** en frontend y backend
- **Sanitización** de datos de entrada

## 📊 Monitoreo

- **Logs en tiempo real** con Supabase
- **Estado de conexión** visible en UI
- **Manejo de errores** con feedback visual
- **Reconexión automática** en caso de fallo

## 🎯 Optimizaciones PWA

- **Prerenderizado parcial** (PPR)
- **Compresión** habilitada
- **Headers de seguridad** configurados
- **Service Worker** para cache inteligente
- **Manifest** optimizado para instalación

## 📱 Compatibilidad

- **Tablets**: iPad, Android tablets
- **TVs**: Smart TVs con navegador
- **Navegadores**: Chrome, Safari, Edge, Firefox
- **Orientación**: Landscape optimizado

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
- Revisar documentación en `/docs`
- Consultar logs en Supabase Dashboard

---

**DarSalud** - Transformando la experiencia interactiva con tecnología PWA 🚀
