# Pruebas del Flujo TV-Tablet

## Modificaciones Realizadas

### 1. ✅ Corrección de Ruta del Botón "Ir a Jugar"
- **Problema**: Ruta incorrecta `/game/roulette?session=...`
- **Solución**: Cambiado a `/game/[sessionId]` y añadida actualización automática de estado a 'playing'

### 2. ✅ Registro Automático de Estado 'Playing'
- **Problema**: Después del registro, la sesión se quedaba en `player_registered`
- **Solución**: El endpoint de registro ahora actualiza automáticamente a `playing`

### 3. ✅ Actualización desde GamePage
- **Problema**: Al acceder directamente al juego no se actualizaba el estado
- **Solución**: GamePage actualiza automáticamente el estado a `playing`

### 4. ✅ Realtime Mejorado para TV
- **Problema**: La TV no detectaba cambios en tiempo real
- **Solución**: Canal específico de realtime + sistema de polling como backup

## Instrucciones de Prueba

### Configuración Inicial

1. **Abrir 2 pestañas/ventanas del navegador:**
   - Pestaña 1: Admin Tablet → `http://localhost:3000/admin`
   - Pestaña 2: Pantalla TV → `http://localhost:3000/tv`

2. **Verificar que aparecen los paneles de debug** (solo en desarrollo):
   - TV: Panel inferior izquierdo con "📺 TV Debug Info"
   - Admin: Panel amarillo superior con "🔧 Debug Panel - Admin"

### Prueba 1: Flujo Completo Normal

1. **En la tablet admin:**
   - Inicia sesión como administrador
   - Crear nueva sesión (botón "Crear Nuevo Juego")

2. **En la TV:**
   - Verificar que muestra "Esperando nueva sesión..."
   - El debug debe mostrar "Sesión actual: Ninguna"

3. **En la tablet admin:**
   - Ir a la pestaña "Juegos" 
   - Hacer clic en la sesión creada para ver detalles
   - Verificar que el estado sea "Pendiente"

4. **Registrar jugador:**
   - En el formulario de registro, completar datos del jugador
   - Hacer clic "Registrar Jugador"

5. **Verificar cambio en TV (AUTOMÁTICO):**
   - ✅ La TV debe cambiar INMEDIATAMENTE a la pantalla "¡Juego en Curso!"
   - ✅ Debe mostrar el nombre del jugador registrado
   - ✅ El debug debe mostrar el estado como "playing"

### Prueba 2: Botón "Ir a Jugar"

1. **En la tablet admin:**
   - Con un jugador ya registrado
   - Hacer clic en "Ir a Jugar"

2. **Verificar:**
   - ✅ Debe navegar a `/game/[sessionId]`
   - ✅ Debe mostrar la ruleta del juego
   - ✅ La TV debe mantener la vista "¡Juego en Curso!"

### Prueba 3: Test de Conectividad (Debug)

1. **En la tablet admin:**
   - Con una sesión activa con jugador registrado
   - Hacer clic en "🧪 Test TV Sync" en el panel de debug

2. **Verificar en TV:**
   - ✅ La TV debe cambiar entre "Invitación" y "Juego en Curso"
   - ✅ Los logs de debug deben mostrar los cambios de estado

### Prueba 4: Sistema de Polling (Backup)

1. **Desconectar/simular falla de realtime:**
   - Abrir DevTools → Network → Simular offline por unos segundos

2. **Hacer cambios en admin mientras está "offline":**
   - Cambiar estado de sesión o registrar jugador

3. **Reconectar:**
   - ✅ En máximo 3 segundos, la TV debe sincronizarse automáticamente

## Logs a Revisar

### En la TV (Consola del Navegador):
```
📺 TV: Configurando realtime específico para TV...
📺 TV: Canal realtime configurado
✅ TV: Suscripción realtime activa
📺 TV: Evento realtime recibido: UPDATE
📺 TV: Estado actualizado: playing
📺 TV (Polling): Detectado cambio en sesión
```

### En el Admin (Consola del Navegador):
```
🔧 Admin: Cambiando estado para probar conectividad con TV...
AdminPanel: Cambio en plays detectado por suscripción
📺 TV debería haber cambiado de pantalla ahora
```

## Solución de Problemas

### TV no cambia de pantalla:

1. **Verificar logs de realtime:**
   - Debe aparecer "✅ TV: Suscripción realtime activa"
   - Si no aparece, hay problema de conectividad con Supabase

2. **Verificar polling de backup:**
   - Debe aparecer logs de "📺 TV (Polling)" cada 3 segundos
   - Si aparece pero no actualiza, revisar la lógica de comparación

3. **Verificar estado en base de datos:**
   - El estado debe cambiar de `player_registered` → `playing`
   - Usar el botón "🔄 Refrescar" en el debug panel

4. **Forzar actualización:**
   - Usar botón "🔄 Refrescar" en la TV (panel debug)
   - Usar botón "🧪 Test TV Sync" en el admin

### Admin no detecta cambios:

1. **Verificar suscripción admin:**
   - Debe aparecer "AdminPanel: Suscrito a cambios en plays"
   - Si no aparece, revisar autenticación del admin

2. **Forzar recarga:**
   - Usar botón "🔄 Refrescar Sesiones" en el debug panel

## Estados Esperados por Pantalla

| Estado Sesión | Pantalla TV | Tablet Admin |
|---------------|-------------|--------------|
| `pending_player_registration` | "Esperando nueva sesión..." | Formulario de registro |
| `player_registered` | "¡Únete al Juego!" | Datos del jugador + "Ir a Jugar" |
| `playing` | "¡Juego en Curso!" | Ruleta del juego |
| `completed` | "¡Juego Completado!" | Resultados finales |

## Notas Adicionales

- El sistema tiene **doble redundancia**: Realtime + Polling cada 3s
- Los logs están prefijados con 📺 (TV) y 🔧 (Admin) para fácil identificación
- Los paneles de debug solo aparecen en `NODE_ENV=development`
- El sistema detecta automáticamente cambios en `session_id`, `status`, y `updated_at` 