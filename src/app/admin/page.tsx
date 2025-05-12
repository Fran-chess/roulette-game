// src/app/admin/page.tsx
'use client';
import { useGameStore } from '@/store/gameStore';
import { exportParticipantsToExcel } from '@/lib/dataManager';
import Button from '@/components/ui/Button'; // Reutiliza tu componente botón

export default function AdminPage() {
  const participants = useGameStore((state) => state.participants);

  const handleExport = () => {
    exportParticipantsToExcel(participants);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Administración del Juego</h1>
      <div className="bg-white p-6 rounded shadow-md">
        <p className="mb-2">Total de participantes registrados: {participants.length}</p>
        {participants.length > 0 ? (
          <Button onClick={handleExport} className="bg-verde-salud text-white">
            Descargar Datos (Excel)
          </Button>
        ) : (
          <p className="text-gray-500">Aún no hay datos para exportar.</p>
        )}
         {/* Opcional: Botón para resetear todos los datos (usar con cuidado) */}
        {/* <Button onClick={() => { if(confirm('¿Seguro que quieres borrar TODOS los datos?')) useGameStore.getState().resetAllData(); }} className="bg-red-500 text-white mt-4">
          Resetear Todos los Datos
        </Button> */}
      </div>
    </div>
  );
}