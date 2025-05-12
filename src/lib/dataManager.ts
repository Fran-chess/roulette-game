// src/lib/dataManager.ts
import * as XLSX from 'xlsx';
import type { Participant } from '@/types';

export const exportParticipantsToExcel = (participants: Participant[], fileName: string = 'participantes_ruleta.xlsx') => {
  if (!participants.length) {
    alert("No hay participantes para exportar.");
    return;
  }

  // Mapear los datos para un formato más legible en Excel (opcional)
  const dataToExport = participants.map(p => ({
    Nombre: p.nombre,
    Apellido: p.apellido || '',
    Email: p.email || '',
    Especialidad: p.especialidad || '',
    FechaRegistro: p.timestamp.toLocaleString('es-AR'), // Formatear fecha
    // Puedes añadir más campos si los registras, como pregunta_respondida, respuesta_correcta, premio_ganado
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Participantes');

  // Ajustar anchos de columna (opcional)
  const colWidths = Object.keys(dataToExport[0] || {}).map(key => ({
    wch: Math.max(key.length, ...dataToExport.map(row => (row[key as keyof typeof row] || '').toString().length)) + 2
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, fileName);
};