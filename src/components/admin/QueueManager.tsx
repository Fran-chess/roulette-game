// src/components/admin/QueueManager.tsx
"use client";
import { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp } from "@/utils/animations";
import AdminPlayerForm from "./AdminPlayerForm";
import Button from "../ui/Button";
import { tvLogger } from "@/utils/tvLogger";

interface QueueManagerProps {
  sessionId: string;
  onClose?: () => void;
}

const QueueManager: React.FC<QueueManagerProps> = ({ sessionId, onClose }) => {
  const { 
    waitingQueue, 
    currentParticipant,
    removeFromQueue, 
    moveToNext, 
    reorderQueue,
    loadQueueFromDB,
    gameState
  } = useGameStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Cargar cola inicial
  useEffect(() => {
    if (sessionId) {
      loadQueueFromDB(sessionId);
    }
  }, [sessionId, loadQueueFromDB]);


  const handleRemoveFromQueue = async (participantId: string) => {
    setIsLoading(true);
    try {
      await removeFromQueue(participantId);
      tvLogger.info('Participante removido de la cola:', participantId);
    } catch (error) {
      tvLogger.error('Error al remover participante de la cola:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToNext = async () => {
    setIsLoading(true);
    try {
      await moveToNext();
      tvLogger.info('Moviendo al siguiente participante');
    } catch (error) {
      tvLogger.error('Error al mover al siguiente participante:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === targetIndex) {
      setDraggedItem(null);
      return;
    }

    const newOrder = [...waitingQueue];
    const draggedParticipant = newOrder[draggedItem];
    newOrder.splice(draggedItem, 1);
    newOrder.splice(targetIndex, 0, draggedParticipant);

    try {
      await reorderQueue(newOrder);
      tvLogger.info('Cola reordenada exitosamente');
    } catch (error) {
      tvLogger.error('Error al reordenar la cola:', error);
    }
    
    setDraggedItem(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Gestión de Cola de Espera
          </h2>
          <p className="text-gray-600 mt-1">
            {waitingQueue.length} participantes en cola
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            + Agregar Participante
          </Button>
          {onClose && (
            <Button
              onClick={onClose}
              variant="secondary"
              className="bg-gray-500 hover:bg-gray-600"
            >
              Cerrar
            </Button>
          )}
        </div>
      </div>

      {/* Estado actual */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Estado Actual</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Participante Activo:</span>
            <p className="font-medium">
              {currentParticipant ? currentParticipant.nombre : 'Ninguno'}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Estado del Juego:</span>
            <p className="font-medium capitalize">
              {gameState === 'waiting' ? 'Esperando' : 
               gameState === 'inGame' ? 'En Juego' : 
               gameState === 'roulette' ? 'Ruleta' : gameState}
            </p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="mb-6 flex gap-4">
        <Button
          onClick={handleMoveToNext}
          disabled={isLoading || (!currentParticipant && waitingQueue.length === 0)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {currentParticipant ? 'Finalizar Actual y Siguiente' : 'Activar Siguiente'}
        </Button>
        <Button
          onClick={() => loadQueueFromDB(sessionId)}
          disabled={isLoading}
          variant="secondary"
        >
          🔄 Refrescar Cola
        </Button>
      </div>

      {/* Cola de espera */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">Cola de Espera</h3>
        
        {waitingQueue.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay participantes en cola</p>
            <p className="text-sm mt-2">Agrega participantes para comenzar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {waitingQueue.map((participant, index) => (
              <motion.div
                key={participant.id}
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  bg-white border border-gray-200 rounded-lg p-4 shadow-sm
                  hover:shadow-md transition-shadow cursor-move
                  ${draggedItem === index ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {participant.nombre} {participant.apellido}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {participant.email}
                        {participant.especialidad && ` • ${participant.especialidad}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {participant.status}
                    </span>
                    <Button
                      onClick={() => handleRemoveFromQueue(participant.id)}
                      variant="secondary"
                      className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-1"
                      disabled={isLoading}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario de agregar participante */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold mb-4">
                Agregar Participante a la Cola
              </h3>
              <AdminPlayerForm
                sessionId={sessionId}
                onPlayerRegistered={() => setShowAddForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QueueManager;