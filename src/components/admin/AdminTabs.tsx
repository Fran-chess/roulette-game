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
    // Contenedor principal de la barra de pestañas.
    // La clase `border-slate-300` define la línea base delgada que corre debajo de todas las pestañas.
    // Ajusta 'border-slate-300' si prefieres otro de tus grises estándar de Tailwind.
    <div className="relative border-b border-slate-300">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="flex" // Permite que los botones hijos usen `flex-1` para distribuirse
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
            whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }} // Sutil feedback visual en hover
            className={`
              flex flex-1 items-center justify-center      // Ocupa espacio equitativamente y centra contenido
              py-3 sm:py-4                               // Padding vertical para altura
              text-sm sm:text-base font-marineBold whitespace-nowrap // Estilo de texto (usa tu font-marineBold)
              transition-colors duration-200 ease-in-out  // Transición suave para colores
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-verde-salud // Estilos de foco usando tu color
              ${ // Lógica condicional para estilos de activo/inactivo
                activeTab === tab.id
                  ? // Pestaña Activa:
                    "text-verde-salud border-b-2 border-verde-salud -mb-px"
                    // - `text-verde-salud`: Usa tu color personalizado.
                    // - `border-b-2 border-verde-salud`: Borde inferior grueso con tu color.
                    // - `-mb-px`: Margen inferior negativo para superponer el borde a la línea base.
                  : // Pestaña Inactiva:
                    "text-slate-500 hover:text-verde-salud border-b border-transparent"
                    // - `text-slate-500`: Un gris estándar de Tailwind para texto inactivo.
                    // - `hover:text-verde-salud`: Cambia a tu color activo en hover.
                    // - `border-b border-transparent`: Borde transparente; la línea visible es la del contenedor.
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