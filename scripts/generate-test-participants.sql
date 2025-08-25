-- Script para generar 30 participantes de prueba
-- Ejecutar este script en el SQL Editor de Supabase Dashboard
-- O actualizar el session_id con la sesión activa de tu aplicación

DO $$
DECLARE
    active_session_id TEXT;
    participant_ids UUID[];
    participant_id UUID;
BEGIN
    -- Obtener la sesión activa más reciente
    SELECT session_id INTO active_session_id 
    FROM game_sessions 
    WHERE status NOT IN ('completed', 'archived', 'closed') 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Verificar que existe una sesión activa
    IF active_session_id IS NULL THEN
        RAISE EXCEPTION 'No hay sesiones activas disponibles. Crea una sesión primero desde el panel de admin.';
    END IF;
    
    -- Insertar 30 participantes de prueba
    INSERT INTO participants (session_id, nombre, apellido, email, especialidad, status, created_at, updated_at) VALUES
        (active_session_id, 'María', 'González', 'maria.gonzalez@test.com', 'Cardiología', 'registered', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
        (active_session_id, 'José', 'Rodríguez', 'jose.rodriguez@test.com', 'Neurología', 'registered', NOW() - INTERVAL '29 minutes', NOW() - INTERVAL '29 minutes'),
        (active_session_id, 'Ana', 'Martínez', 'ana.martinez@test.com', 'Pediatría', 'registered', NOW() - INTERVAL '28 minutes', NOW() - INTERVAL '28 minutes'),
        (active_session_id, 'Carlos', 'López', 'carlos.lopez@test.com', 'Ginecología', 'registered', NOW() - INTERVAL '27 minutes', NOW() - INTERVAL '27 minutes'),
        (active_session_id, 'Laura', 'Sánchez', 'laura.sanchez@test.com', 'Dermatología', 'registered', NOW() - INTERVAL '26 minutes', NOW() - INTERVAL '26 minutes'),
        (active_session_id, 'Miguel', 'Torres', 'miguel.torres@test.com', 'Oftalmología', 'registered', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'),
        (active_session_id, 'Carmen', 'Díaz', 'carmen.diaz@test.com', 'Traumatología', 'registered', NOW() - INTERVAL '24 minutes', NOW() - INTERVAL '24 minutes'),
        (active_session_id, 'Roberto', 'Herrera', 'roberto.herrera@test.com', 'Urología', 'registered', NOW() - INTERVAL '23 minutes', NOW() - INTERVAL '23 minutes'),
        (active_session_id, 'Elena', 'Morales', 'elena.morales@test.com', 'Endocrinología', 'registered', NOW() - INTERVAL '22 minutes', NOW() - INTERVAL '22 minutes'),
        (active_session_id, 'David', 'Jiménez', 'david.jimenez@test.com', 'Gastroenterología', 'registered', NOW() - INTERVAL '21 minutes', NOW() - INTERVAL '21 minutes'),
        (active_session_id, 'Patricia', 'Ruiz', 'patricia.ruiz@test.com', 'Psiquiatría', 'registered', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes'),
        (active_session_id, 'Fernando', 'Vargas', 'fernando.vargas@test.com', 'Oncología', 'registered', NOW() - INTERVAL '19 minutes', NOW() - INTERVAL '19 minutes'),
        (active_session_id, 'Isabel', 'Castro', 'isabel.castro@test.com', 'Hematología', 'registered', NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '18 minutes'),
        (active_session_id, 'Antonio', 'Ortega', 'antonio.ortega@test.com', 'Neumología', 'registered', NOW() - INTERVAL '17 minutes', NOW() - INTERVAL '17 minutes'),
        (active_session_id, 'Mónica', 'Delgado', 'monica.delgado@test.com', 'Reumatología', 'registered', NOW() - INTERVAL '16 minutes', NOW() - INTERVAL '16 minutes'),
        (active_session_id, 'Javier', 'Peña', 'javier.pena@test.com', 'Nefrología', 'registered', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'),
        (active_session_id, 'Rosa', 'Aguilar', 'rosa.aguilar@test.com', 'Infectología', 'registered', NOW() - INTERVAL '14 minutes', NOW() - INTERVAL '14 minutes'),
        (active_session_id, 'Sergio', 'Mendoza', 'sergio.mendoza@test.com', 'Anestesiología', 'registered', NOW() - INTERVAL '13 minutes', NOW() - INTERVAL '13 minutes'),
        (active_session_id, 'Beatriz', 'Silva', 'beatriz.silva@test.com', 'Radiología', 'registered', NOW() - INTERVAL '12 minutes', NOW() - INTERVAL '12 minutes'),
        (active_session_id, 'Raúl', 'Campos', 'raul.campos@test.com', 'Medicina Interna', 'registered', NOW() - INTERVAL '11 minutes', NOW() - INTERVAL '11 minutes'),
        (active_session_id, 'Cristina', 'Vega', 'cristina.vega@test.com', 'Medicina Familiar', 'registered', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes'),
        (active_session_id, 'Alejandro', 'Romero', 'alejandro.romero@test.com', 'Cirugía General', 'registered', NOW() - INTERVAL '9 minutes', NOW() - INTERVAL '9 minutes'),
        (active_session_id, 'Lucía', 'Fernández', 'lucia.fernandez@test.com', 'Medicina de Emergencia', 'registered', NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '8 minutes'),
        (active_session_id, 'Pablo', 'Guerrero', 'pablo.guerrero@test.com', 'Medicina Preventiva', 'registered', NOW() - INTERVAL '7 minutes', NOW() - INTERVAL '7 minutes'),
        (active_session_id, 'Valeria', 'Ramos', 'valeria.ramos@test.com', 'Geriatría', 'registered', NOW() - INTERVAL '6 minutes', NOW() - INTERVAL '6 minutes'),
        (active_session_id, 'Eduardo', 'Flores', 'eduardo.flores@test.com', 'Medicina del Deporte', 'registered', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes'),
        (active_session_id, 'Andrea', 'Cortés', 'andrea.cortes@test.com', 'Medicina Ocupacional', 'registered', NOW() - INTERVAL '4 minutes', NOW() - INTERVAL '4 minutes'),
        (active_session_id, 'Ricardo', 'Medina', 'ricardo.medina@test.com', 'Medicina Legal', 'registered', NOW() - INTERVAL '3 minutes', NOW() - INTERVAL '3 minutes'),
        (active_session_id, 'Gabriela', 'Salinas', 'gabriela.salinas@test.com', 'Epidemiología', 'registered', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '2 minutes'),
        (active_session_id, 'Diego', 'Paredes', 'diego.paredes@test.com', 'Bioética', 'registered', NOW() - INTERVAL '1 minute', NOW() - INTERVAL '1 minute');
    
    -- PASO 2: Obtener los IDs de los participantes recién creados
    SELECT ARRAY(
        SELECT id FROM participants 
        WHERE session_id = active_session_id 
        AND email LIKE '%@test.com' 
        ORDER BY created_at DESC 
        LIMIT 30
    ) INTO participant_ids;
    
    -- PASO 3: Agregar todos los participantes a la waiting_queue de la sesión
    UPDATE game_sessions 
    SET waiting_queue = array_to_json(participant_ids)::jsonb,
        updated_at = NOW()
    WHERE session_id = active_session_id;
    
    -- Mostrar confirmación
    RAISE NOTICE '✅ Se han creado 30 participantes de prueba para la sesión: %', active_session_id;
    RAISE NOTICE '✅ Todos los participantes han sido agregados a la waiting_queue automáticamente.';
    RAISE NOTICE 'Los participantes tienen status "registered" y están listos para jugar.';
    RAISE NOTICE 'IDs agregados a cola: %', participant_ids;
    
END $$;