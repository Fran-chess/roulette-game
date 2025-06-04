-- [modificación] Migración para corregir el tipo de dato de session_id en tabla plays
-- De: session_id TEXT
-- A: session_id UUID
-- 
-- IMPORTANTE: Ejecutar esta migración cuando no haya datos críticos en la tabla plays
-- o asegurarse de que todos los session_id existentes tengan formato UUID válido

-- Paso 1: Verificar datos existentes (opcional - para debugging)
-- Comentario: Esta consulta muestra los session_id existentes para verificar formato
-- SELECT session_id, length(session_id), session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' as is_valid_uuid 
-- FROM plays;

-- Paso 2: Crear una nueva columna temporal tipo UUID
ALTER TABLE plays ADD COLUMN session_id_temp UUID;

-- Paso 3: Convertir los datos existentes de TEXT a UUID
-- Solo funciona si los datos ya tienen formato UUID válido
UPDATE plays 
SET session_id_temp = session_id::UUID 
WHERE session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Paso 4: Verificar que todos los registros se convirtieron correctamente
-- Si hay registros NULL en session_id_temp, significa que no tenían formato UUID válido
-- Comentario: Descomentar la siguiente línea para verificar
-- SELECT id, session_id, session_id_temp FROM plays WHERE session_id_temp IS NULL;

-- Paso 5: Eliminar la columna original
ALTER TABLE plays DROP COLUMN session_id;

-- Paso 6: Renombrar la columna temporal
ALTER TABLE plays RENAME COLUMN session_id_temp TO session_id;

-- Paso 7: Agregar restricción NOT NULL (ya que la columna original era NOT NULL)
ALTER TABLE plays ALTER COLUMN session_id SET NOT NULL;

-- Paso 8: Recrear el índice si existía
-- Comentario: El índice se perdió al eliminar la columna, hay que recrearlo
DROP INDEX IF EXISTS idx_plays_session_id;
CREATE INDEX idx_plays_session_id ON plays (session_id);

-- Paso 9: Verificación final
-- Comentario: Verificar que el tipo de dato sea correcto
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'plays' AND column_name = 'session_id';

-- [modificación] Comentario informativo
-- Esta migración corrige el problema:
-- "column "session_id" is of type uuid but expression is of type text"
-- 
-- Después de ejecutar esta migración, las funciones JavaScript en supabaseHelpers.ts
-- funcionarán correctamente sin necesidad de cast explícito a UUID. 