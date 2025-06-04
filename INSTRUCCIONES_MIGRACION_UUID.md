# 🛠️ Migración: Corregir Tipo de Dato session_id

## Problema Identificado

**Error**: `column "session_id" is of type uuid but expression is of type text`

**Causa**: La columna `session_id` en la tabla `plays` está definida como `TEXT` cuando debería ser `UUID`.

## Solución

### Opción 1: Migración Automática (Recomendada)

**Ejecutar el archivo SQL en tu Dashboard de Supabase:**

1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `migration_fix_session_id_uuid.sql`
4. Ejecuta la migración
5. Verifica que no haya errores

### Opción 2: Migración Manual

Si prefieres ejecutar paso a paso:

```sql
-- 1. Verificar datos existentes
SELECT session_id, length(session_id) 
FROM plays;

-- 2. Crear columna temporal
ALTER TABLE plays ADD COLUMN session_id_temp UUID;

-- 3. Convertir datos existentes
UPDATE plays 
SET session_id_temp = session_id::UUID 
WHERE session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- 4. Verificar conversión
SELECT id, session_id, session_id_temp 
FROM plays WHERE session_id_temp IS NULL;

-- 5. Si todo está OK, continuar...
ALTER TABLE plays DROP COLUMN session_id;
ALTER TABLE plays RENAME COLUMN session_id_temp TO session_id;
ALTER TABLE plays ALTER COLUMN session_id SET NOT NULL;

-- 6. Recrear índice
DROP INDEX IF EXISTS idx_plays_session_id;
CREATE INDEX idx_plays_session_id ON plays (session_id);
```

## Verificación Post-Migración

Después de ejecutar la migración, verifica que el tipo de dato sea correcto:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'plays' AND column_name = 'session_id';
```

**Resultado esperado:**
- `column_name`: session_id
- `data_type`: uuid
- `is_nullable`: NO

## Impacto en el Código

Después de esta migración:

### ✅ Funcionará Correctamente
- `createGameSession()` en `supabaseHelpers.ts`
- `upsertSessionParticipant()` en `supabaseHelpers.ts`
- Todas las consultas que usan `session_id`
- Realtime subscriptions

### 🚨 Precauciones

1. **Respaldo**: Haz un respaldo de la tabla `plays` antes de ejecutar
2. **Downtime**: Ejecuta durante períodos de bajo uso
3. **Verificación**: Confirma que todos los `session_id` existentes tengan formato UUID válido

## Comandos de Respaldo (Opcional)

```sql
-- Crear respaldo de la tabla
CREATE TABLE plays_backup AS SELECT * FROM plays;

-- Restaurar desde respaldo (si es necesario)
-- DROP TABLE plays;
-- ALTER TABLE plays_backup RENAME TO plays;
```

## Después de la Migración

1. **Reinicia tu aplicación** para que tome los cambios
2. **Prueba crear una nueva sesión** desde el panel admin
3. **Verifica el realtime** entre tablet y TV
4. **Elimina datos de prueba** si es necesario

## Solución de Problemas

### Si la migración falla:

**Error en conversión de datos:**
```sql
-- Verificar datos que no son UUID válidos
SELECT session_id 
FROM plays 
WHERE NOT (session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
```

**Restaurar desde respaldo:**
```sql
DROP TABLE plays;
ALTER TABLE plays_backup RENAME TO plays;
```

### Si hay datos corruptos:

1. Identifica los registros problemáticos
2. Corrige manualmente los `session_id` inválidos
3. Re-ejecuta la migración

## Confirmación Final

Después de la migración exitosa, tu código JavaScript funcionará sin el error:
`"column "session_id" is of type uuid but expression is of type text"`

Los `generateUUID()` y `validateUUID()` trabajarán perfectamente con la nueva estructura. 