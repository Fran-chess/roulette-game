// [modificación] Script de prueba para verificar las funciones UUID
import { validateUUID, generateUUID } from './supabaseHelpers';

export function testUUIDFunctions() {
  console.log('🧪 TEST: Iniciando pruebas de funciones UUID...');
  
  // Test 1: Generar UUID
  try {
    const newUUID = generateUUID();
    console.log(`✅ TEST: UUID generado: ${newUUID}`);
    
    // Test 2: Validar UUID generado
    const validatedUUID = validateUUID(newUUID);
    console.log(`✅ TEST: UUID validado: ${validatedUUID}`);
    
    // Test 3: Validar UUID inválido
    try {
      validateUUID('invalid-uuid');
      console.log('❌ TEST: Debería haber fallado con UUID inválido');
    } catch (error) {
      console.log(`✅ TEST: UUID inválido correctamente rechazado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
    
    // Test 4: Validar UUID válido conocido
    const knownValidUUID = '550e8400-e29b-41d4-a716-446655440000';
    const validatedKnownUUID = validateUUID(knownValidUUID);
    console.log(`✅ TEST: UUID conocido validado: ${validatedKnownUUID}`);
    
    console.log('🎉 TEST: Todas las pruebas UUID pasaron exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ TEST: Error en las pruebas UUID:', error);
    return false;
  }
}

// [modificación] Función para verificar el formato UUID específico de PostgreSQL
export function isValidPostgreSQLUUID(uuid: string): boolean {
  const postgresUUIDRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return postgresUUIDRegex.test(uuid);
}

// [modificación] Función para debugging de tipos en Supabase
export function debugSupabaseTypes() {
  console.log('🔍 DEBUG: Verificando tipos de datos para Supabase...');
  
  const testUUID = generateUUID();
  console.log(`UUID generado: ${testUUID}`);
  console.log(`Tipo: ${typeof testUUID}`);
  console.log(`Es string: ${typeof testUUID === 'string'}`);
  console.log(`Es UUID válido: ${isValidPostgreSQLUUID(testUUID)}`);
  
  return {
    uuid: testUUID,
    type: typeof testUUID,
    isString: typeof testUUID === 'string',
    isValidUUID: isValidPostgreSQLUUID(testUUID)
  };
} 