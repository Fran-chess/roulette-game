// src/components/admin/AdminPanel.tsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabaseAdminClient } from "@/lib/supabase-admin"; // Cliente de Supabase específico para admin
import { useGameStore } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import AdminTabs from "./AdminTabs";
import DashboardTabContent from "./DashboardTabContent";
import SessionsTabContent from "./SessionsTabContent";
import SessionDetailView from "./SessionDetailView";
import { fadeInUp } from "@/utils/animations";
import { PlaySession } from "@/types";
import SnackbarNotification from "../ui/SnackbarNotification";


interface AdminData {
  id: string;
  name: string;
  email: string;
}

type PayloadUpdate = {
  eventType: string;
  new: Partial<PlaySession>; // Usar Partial ya que el payload puede no tener todos los campos
  old?: Partial<PlaySession>;
};

interface AdminPanelProps {
  adminData: AdminData;
  onLogout?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ adminData, onLogout }) => {
  type ActiveTabType = "dashboard" | "sessions" | "new-session";
  const [activeTab, setActiveTab] = useState<ActiveTabType>("dashboard");
  const isInitializedRef = useRef(false);

  // Extraer estados y funciones del store global
  const {
    adminState,
    fetchGameSessions,
    fetchActiveSession,
    setAdminCurrentSession,
    setAdminNotification,
    clearAdminNotifications,
    createNewSession,
    updateSessionStatus,
    fetchParticipantsStats,
  } = useGameStore();

  // [modificación] Usar clearAdminNotifications del store global
  const clearNotifications = () => {
    clearAdminNotifications();
  };

  // [modificación] Usar fetchGameSessions del store global
  const fetchActiveSessions = useCallback(async () => {
    if (!adminData?.id) {
      return;
    }

    await fetchGameSessions();
  }, [adminData?.id, fetchGameSessions]);

  const [snackbar, setSnackbar] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Efecto para mostrar snackbar cuando cambian los mensajes del store
  useEffect(() => {
    if (adminState.success) {
      setSnackbar({ type: "success", message: adminState.success });
      clearAdminNotifications();
    }
    if (adminState.error) {
      setSnackbar({ type: "error", message: adminState.error });
      clearAdminNotifications();
    }
  }, [adminState.success, adminState.error, clearAdminNotifications]);

  // Autocierre después de 3 segundos
  useEffect(() => {
    if (snackbar) {
      const timer = setTimeout(() => setSnackbar(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbar]);

  // [modificación] Cargar datos iniciales - Solo ejecutar una vez por adminId
  useEffect(() => {
    if (adminData?.id && !isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // Cargar datos iniciales de forma simple
      const loadInitialData = async () => {
        await fetchActiveSession();
        await fetchGameSessions();
        await fetchParticipantsStats();
      };
      
      loadInitialData();
    }

    // Reset cuando cambie el adminId
    return () => {
      if (adminData?.id) {
        isInitializedRef.current = false;
      }
    };
  }, [adminData?.id, fetchActiveSession, fetchGameSessions, fetchParticipantsStats]); // Agregar dependencias faltantes

  // [modificación] Suscripción a realtime por separado
  useEffect(() => {
    if (!adminData?.id) return;

    const playsChannel = supabaseAdminClient
      .channel(`admin_plays_changes_${adminData.id}`)
      .on<Partial<PlaySession>>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "plays",
          filter: `admin_id=eq.${adminData.id}`,
        },
        (payload: PayloadUpdate) => {
          fetchActiveSessions(); // Vuelve a cargar la lista completa desde la API al detectar un cambio

          if (payload.new && payload.new.session_id) {
            setAdminNotification(
              "success",
              `Nuevo juego ${String(payload.new.session_id).substring(
                0,
                8
              )} creado (detectado en tiempo real).`
            );
          }
        }
      )
      .on<Partial<PlaySession>>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "plays",
          filter: `admin_id=eq.${adminData.id}`,
        },
        (payload: PayloadUpdate) => {
          fetchActiveSessions(); // Vuelve a cargar la lista completa desde la API al detectar un cambio

          if (
            adminState.currentSession &&
            payload.new &&
            payload.new.session_id &&
            payload.new.session_id === adminState.currentSession.session_id
          ) {
            const updatedSession = {
              ...adminState.currentSession,
              ...payload.new,
            };
            setAdminCurrentSession(updatedSession as PlaySession);
          }

          if (
            payload.old?.status !== payload.new?.status &&
            payload.new?.session_id
          ) {
            setAdminNotification(
              "success",
              `Juego ${String(payload.new.session_id).substring(
                0,
                8
              )} actualizado a ${
                payload.new.status
              } (detectado en tiempo real).`
            );
          }
        }
      )
      .on<Partial<PlaySession>>(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "plays",
          filter: `admin_id=eq.${adminData.id}`,
        },
        (payload: PayloadUpdate) => {
          fetchActiveSessions(); // Vuelve a cargar la lista completa desde la API al detectar un cambio

          if (payload.old && payload.old.session_id) {
            setAdminNotification(
              "success",
              `Juego ${String(payload.old.session_id).substring(
                0,
                8
              )} eliminado (detectado en tiempo real).`
            );
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error(
            "AdminPanel: Error en la suscripción a Supabase:",
            err
          );
          setAdminNotification(
            "error",
            "Error de conexión en tiempo real. Los datos podrían no estar actualizados consistentemente."
          );
        }
      });

    return () => {
      supabaseAdminClient.removeChannel(playsChannel);
    };
  }, [adminData?.id, adminState.currentSession, fetchActiveSessions, setAdminCurrentSession, setAdminNotification]); // Agregar dependencias faltantes

  // [modificación] Usar createNewSession del store global
  const handleCreateNewSession = async () => {
    const sessionId = await createNewSession();

    if (sessionId) {
      // Navegar a la pestaña de sesiones después de crear exitosamente
      setTimeout(() => {
        setActiveTab("sessions");
      }, 100);
    }
  };


  // [modificación] Usar updateSessionStatus del store global
  const handleUpdateSessionStatus = async (
    sessionId: string,
    status: string
  ) => {
    await updateSessionStatus(sessionId, status);
  };

  // [modificación] Usar setAdminNotification del store global
  const handlePlayerRegistered = () => {
    setAdminNotification(
      "success",
      "Jugador registrado exitosamente. La lista de sesiones y detalles se actualizarán."
    );
  };

  const handleLogoutCallback =
    onLogout ||
    (() => {
      // Aquí podrías limpiar el estado de Zustand (adminUser) si es necesario
      // useGameStore.getState().setAdminUser(null);
      // localStorage.removeItem('adminUser'); // Esto ya debería estar en la page.tsx
      // router.push('/admin'); // Redirigir si es necesario
    });

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4">
      {/* [modificación] - Fondo mejorado con gradiente animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-teal-500/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent_50%)]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-5xl mx-auto rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl admin-panel-container"
        style={{
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* --- Barra de tabs admin arriba --- */}
        <AdminTabs
          activeTab={activeTab}
          setActiveTab={(tabId) => {
            setActiveTab(tabId as ActiveTabType);
            clearNotifications();
            if (tabId !== "new-session") {
              setAdminCurrentSession(null);
            }
          }}
        />

        {/* --- SnackbarNotification flotante --- */}
        {snackbar && (
          <SnackbarNotification
            type={snackbar.type}
            message={snackbar.message}
            onClose={() => setSnackbar(null)}
          />
        )}

        {/* --- Contenido principal del panel admin --- */}
        <motion.div
          className="overflow-hidden scrollable-content admin-scrollable-content"
          style={{
            minHeight: "auto",
            maxHeight: "calc(100vh - 180px)",
          }}
        >
          {/* [modificación] Panel de debug para desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 m-4">
              <h4 className="text-yellow-300 font-bold text-sm mb-2">🔧 Debug Panel - Admin</h4>
              <div className="text-xs text-yellow-200 space-y-1">
                <p>Admin ID: {adminData?.id}</p>
                <p>Sesiones activas: {adminState.activeSessions.length}</p>
                <p>Sesión actual: {adminState.currentSession?.session_id?.substring(0,8) || 'Ninguna'}</p>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={async () => {
                      await fetchActiveSessions();
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs"
                  >
                    🔄 Refrescar Sesiones
                  </button>
                  {adminState.currentSession && (
                    <button 
                      onClick={async () => {
                        const newStatus = adminState.currentSession?.status === 'playing' ? 'player_registered' : 'playing';
                        await updateSessionStatus(adminState.currentSession!.session_id, newStatus);
                        setTimeout(() => {
                        }, 1000);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                    >
                      🧪 Test TV Sync
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <DashboardTabContent
                key="dashboard"
                // [modificación] Usar estadísticas de participantes del store en lugar del array local
                participantsCount={adminState.participantsStats.count}
                activeSessionsCount={
                  adminState.activeSessions.filter(
                    (s) => s.status !== "completed" && s.status !== "archived"
                  ).length
                }
                onInitiateNewSession={handleCreateNewSession}
                onLogout={handleLogoutCallback}
                isLoading={adminState.isLoading.sessionAction}
                onNavigateToSessions={() => setActiveTab("sessions")}
              />
            )}
            {activeTab === "sessions" && (
              <SessionsTabContent
                key="sessions"
                activeSessions={adminState.activeSessions}
                onCreateNewSession={handleCreateNewSession}
                isLoadingCreation={adminState.isLoading.sessionAction}
                isLoadingList={adminState.isLoading.sessionsList}
                onRefreshSessions={fetchActiveSessions}
                onSelectSession={(session) => {
                  setAdminCurrentSession(session);
                  setActiveTab("new-session");
                }}
              />
            )}
            {activeTab === "new-session" && adminState.currentSession && (
              <SessionDetailView
                key={`session-detail-${adminState.currentSession.id}`}
                session={adminState.currentSession}
                onBackToSessions={() => {
                  setActiveTab("sessions");
                  clearNotifications();
                  setAdminCurrentSession(null);
                }}
                onUpdateStatus={handleUpdateSessionStatus}
                isLoadingUpdate={adminState.isLoading.sessionAction}
                onPlayerRegistered={handlePlayerRegistered}
              />
            )}
            {activeTab === "new-session" && !adminState.currentSession && (
              <motion.div
                key="no-session-selected"
                className="p-6 text-center text-slate-300"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <p className="font-sans">Selecciona un juego de la lista para ver sus detalles.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminPanel;
