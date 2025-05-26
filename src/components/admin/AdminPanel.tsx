// src/components/admin/AdminPanel.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase"; // Sigue siendo necesario para la suscripción en tiempo real
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

  // Extraer estados y funciones del store global
  const {
    adminState,
    fetchGameSessions,
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
      console.log(
        "AdminPanel: fetchActiveSessions - adminData.id NO disponible. No se llamará a la API."
      );
      return;
    }

    console.log(
      `AdminPanel: fetchActiveSessions - Llamando a la función del store global para adminData.id: ${adminData.id}`
    );
    await fetchGameSessions();
  }, [adminData?.id, fetchGameSessions]);

  // [modificación] Nueva función para cargar estadísticas de participantes
  const loadParticipantsStats = useCallback(async () => {
    console.log('AdminPanel: Cargando estadísticas de participantes...');
    await fetchParticipantsStats();
  }, [fetchParticipantsStats]);

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

  // [modificación] Cargar datos iniciales incluyendo estadísticas de participantes
  useEffect(() => {
    if (adminData?.id) {
      fetchActiveSessions(); // Carga inicial de sesiones
      loadParticipantsStats(); // [modificación] Carga inicial de estadísticas de participantes

      const playsChannel = supabaseClient
        .channel(`admin_plays_changes_${adminData.id}`)
        .on<Partial<PlaySession>>(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "plays",
            filter: `admin_id=eq.${adminData.id}`,
          },
          (payload: PayloadUpdate) => {
            console.log(
              "AdminPanel: Cambio en plays detectado por suscripción:",
              payload
            );
            fetchActiveSessions(); // Vuelve a cargar la lista completa desde la API al detectar un cambio
            // [modificación] Recargar estadísticas de participantes cuando hay cambios
            loadParticipantsStats();

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

            if (payload.eventType === "INSERT" && payload.new.session_id) {
              setAdminNotification(
                "success",
                `Nuevo juego ${String(payload.new.session_id).substring(
                  0,
                  8
                )} creado (detectado en tiempo real).`
              );
            }

            if (
              payload.eventType === "UPDATE" &&
              payload.old?.status !== payload.new?.status &&
              payload.new.session_id
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
          } else {
            console.log(
              "AdminPanel: Suscrito a cambios en plays para admin:",
              adminData.id,
              "Estado:",
              status
            );
          }
        });

      return () => {
        console.log(
          "AdminPanel: Removiendo canal de suscripción a plays para admin:",
          adminData.id
        );
        supabaseClient.removeChannel(playsChannel);
      };
    }
  }, [
    adminData?.id,
    fetchActiveSessions,
    // [modificación] Agregar loadParticipantsStats a las dependencias
    loadParticipantsStats,
    adminState.currentSession,
    setAdminCurrentSession,
    setAdminNotification,
  ]);

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
    // [modificación] Recargar estadísticas de participantes cuando se registra un nuevo jugador
    loadParticipantsStats();
  };

  const handleLogoutCallback =
    onLogout ||
    (() => {
      console.log("AdminPanel: Ejecutando logout por defecto");
      // Aquí podrías limpiar el estado de Zustand (adminUser) si es necesario
      // useGameStore.getState().setAdminUser(null);
      // localStorage.removeItem('adminUser'); // Esto ya debería estar en la page.tsx
      // router.push('/admin'); // Redirigir si es necesario
    });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto rounded-xl overflow-hidden touch-optimized"
      style={{
        backdropFilter: "blur(10px)",
        background: "rgba(255, 255, 255, 0.1)",
        zIndex: 10,
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
        className="overflow-hidden scrollable-content"
        style={{
          minHeight: "auto",
          maxHeight: "calc(100vh - 180px)",
        }}
      >
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
              totalSessionsCount={adminState.activeSessions.length}
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
              className="p-6 text-center text-slate-600 dark:text-slate-300"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <p>Selecciona un juego de la lista para ver sus detalles.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AdminPanel;
