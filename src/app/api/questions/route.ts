import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';

/**
 * Maneja solicitudes GET para obtener todas las preguntas del juego
 * @returns {Promise<NextResponse>} Respuesta con las preguntas en formato JSON
 */
export async function GET() {
  try {
    // Devuelve los datos de preguntas desde el archivo JSON
    return NextResponse.json({
      message: "Preguntas obtenidas exitosamente",
      questions: questionsData
    });
  } catch (error: any) {
    console.error('Error al obtener preguntas:', error);
    return NextResponse.json(
      { message: 'Error al obtener preguntas', error: error.message },
      { status: 500 }
    );
  }
} 