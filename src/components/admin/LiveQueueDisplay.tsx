// src/components/admin/LiveQueueDisplay.tsx
"use client";
import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import React from 'react';

interface LiveQueueDisplayProps {
  sessionId: string;
  compact?: boolean;
}

const LiveQueueDisplay: React.FC<LiveQueueDisplayProps> = ({ sessionId }) => {
  const { 
    waitingQueue, 
    currentParticipant, 
    loadQueueFromDB,
    removeFromQueue,
    cleanupCompletedFromQueue 
  } = useGameStore();
  
  const [isLoading, setIsLoading] = useState(false);

  // Cargar cola inicial SIN auto-refresh
  useEffect(() => {
    const loadQueue = async () => {
      if (sessionId) {
        console.log('🔄 LIVE-QUEUE: Carga inicial para sesión:', sessionId);
        await loadQueueFromDB(sessionId);
      }
    };
    
    // Solo cargar una vez al montar el componente
    loadQueue();
  }, [sessionId, loadQueueFromDB]);

  // Debug logs para ver estado actual (solo cuando cambia realmente)
  useEffect(() => {
    if (currentParticipant || waitingQueue.length > 0) {
      console.log('🔄 LIVE-QUEUE: Estado actualizado para sesión:', sessionId);
      console.log('   - Participante activo:', currentParticipant?.nombre || 'None');
      console.log('   - Cola:', waitingQueue.length, 'participantes');
      if (waitingQueue.length > 0) {
        console.log('   - Participantes en cola:', waitingQueue.map(p => p.nombre));
      }
    }
  }, [currentParticipant, waitingQueue, sessionId]);

  // Cleanup periódico de participantes completados
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanupCompletedFromQueue();
    }, 30000); // Cada 30 segundos (aumentado para reducir frecuencia)

    return () => clearInterval(cleanupInterval);
  }, [cleanupCompletedFromQueue]);

  // handleMoveToNext removed as it's not used

  const handleRemoveFromQueue = async (participantId: string) => {
    setIsLoading(true);
    try {
      await removeFromQueue(participantId);
    } catch (error) {
      console.error('Error al remover participante:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-xl">
        <h2 className="text-xl font-marineBold">Gestión de Cola</h2>
        <p className="text-purple-100 text-sm font-marineRegular">
          {waitingQueue.length} participantes en cola
        </p>
      </div>

      {/* Participante Actual */}
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-marineBold text-white mb-3">Participante Actual</h3>
        {currentParticipant ? (
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-400/30 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <h4 className="font-marineBold text-green-300 text-lg">
                  {currentParticipant.nombre} {currentParticipant.apellido}
                </h4>
                <p className="text-green-200 text-sm font-marineRegular">{currentParticipant.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/20 rounded-lg p-4 text-center">
            <p className="text-slate-300 font-marineRegular">No hay participante activo</p>
          </div>
        )}
      </div>

      {/* Cola de Espera */}
      <div className="p-4">
        <h3 className="text-lg font-marineBold text-white mb-3">Participantes en Cola</h3>
        
        {waitingQueue.length === 0 ? (
          <div className="text-center py-8 text-slate-300">
            <p className="font-marineRegular">No hay participantes en cola</p>
          </div>
        ) : (
          <div className="space-y-2">
            {waitingQueue.map((participant, index) => (
              <div
                key={`${participant.id}-${index}`}
                className="flex items-center justify-between bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg p-3 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-marineBold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-marineBold text-white">
                      {participant.nombre} {participant.apellido}
                    </h4>
                    <p className="text-slate-300 text-sm font-marineRegular">{participant.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFromQueue(participant.id)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1 rounded-lg text-sm font-marineBold disabled:opacity-50 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveQueueDisplay;