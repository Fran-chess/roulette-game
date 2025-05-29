// src/components/admin/AdminTabs.tsx
import { motion } from 'framer-motion';
// Asegúrate de que los íconos sean los correctos para tu caso de uso.
import { FiHome, FiCalendar } from 'react-icons/fi';
// import { FiPlusCircle } from 'react-icons/fi'; // Si 'new-session' también es un tab visible

interface AdminTabsProps {
  activeTab: 'dashboard' | 'sessions' | 'new-session';
  setActiveTab: (tabId: 'dashboard' | 'sessions' | 'new-session') => void;
}

const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: FiHome },
    { id: 'sessions' as const, label: 'Juegos', icon: FiCalendar },
    // Si 'new-session' debe ser un tab visible, añádelo aquí:
    // { id: 'new-session' as const, label: 'Nueva Sesión', icon: FiPlusCircle },
  ];

  return (
    // Contenedor principal con esquema oscuro
    <div className="relative border-b border-white/20">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="flex"
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
            className={`
              flex flex-1 items-center justify-center      // Ocupa espacio equitativamente y centra contenido
              py-3 sm:py-4                               // Padding vertical para altura
              text-sm sm:text-base font-marineBold whitespace-nowrap // Usar font-marineBold
              transition-colors duration-200 ease-in-out  // Transición suave para colores
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-blue-500/50 // Ring azul para consistencia
              ${ // Lógica condicional para estilos de activo/inactivo
                activeTab === tab.id
                  ? // Pestaña Activa con colores oscuros:
                    "text-blue-400 border-b-2 border-blue-400 -mb-px"
                  : // Pestaña Inactiva con colores oscuros:
                    "text-slate-300 hover:text-blue-300 border-b border-transparent"
              }
            `}
          >
            <tab.icon className="mr-2 shrink-0" size={18} />
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default AdminTabs;