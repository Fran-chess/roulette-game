// [modificación] Script de prueba para el endpoint de creación de sesiones
// Ejecutar con: node test_create_session.js

const testCreateSession = async () => {
  try {
    console.log('🧪 TEST: Probando endpoint /api/admin/sessions/create...');
    
    const response = await fetch('http://localhost:3000/api/admin/sessions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: En producción, aquí irían las cookies de autenticación
      },
    });

    console.log(`📊 STATUS: ${response.status}`);
    
    const data = await response.json();
    console.log('📄 RESPONSE:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('✅ TEST EXITOSO: Sesión creada correctamente');
      console.log(`🔗 Session ID: ${data.sessionId}`);
    } else {
      console.log('❌ TEST FALLIDO:', data.message || 'Error desconocido');
    }

  } catch (error) {
    console.error('💥 ERROR EN TEST:', error.message);
  }
};

// Ejecutar test
testCreateSession(); 