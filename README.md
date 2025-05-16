# Juego de Ruleta - DarSalud

Aplicación interactiva que simula una ruleta para seleccionar categorías de preguntas de manera aleatoria y atractiva para usuarios, diseñada específicamente para eventos y exhibiciones de DarSalud.

## Descripción

Este proyecto es una aplicación web interactiva desarrollada con Next.js que permite a los participantes:
- Registrarse en el juego
- Girar una ruleta
- Responder preguntas según la categoría seleccionada
- Ganar premios basados en sus respuestas correctas

La aplicación incluye un panel de administración para gestionar sesiones de juego, monitorear la participación y exportar resultados.

## Características Principales

- **Ruleta Interactiva**: Implementada con Canvas API y animaciones realistas
- **Flujo de Juego Completo**: Desde registro hasta entrega de premios
- **Modo Pantalla de Reposo**: Screensaver automático que muestra videos promocionales
- **Panel de Administración**: Para crear y gestionar sesiones de juego
- **Integración con Supabase**: Almacenamiento seguro y eficiente de datos
- **Diseño Adaptable**: Optimizado para dispositivos táctiles y pantallas grandes
- **Personalización Visual**: Utiliza la paleta de colores corporativa de DarSalud

## Tecnologías Utilizadas

- **Frontend**: 
  - Next.js 15.3 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS 4
  - Framer Motion para animaciones
  - Zustand para gestión de estado global

- **Backend**:
  - Supabase para almacenamiento de datos
  - API Routes de Next.js
  - Edge Functions para operaciones de servidor

- **Despliegue**:
  - Compatible con cualquier plataforma que soporte Next.js

## Estructura del Proyecto

```
/
├── src/
│   ├── app/                    # Páginas de la aplicación (App Router)
│   ├── components/             # Componentes reutilizables
│   │   ├── admin/              # Componentes del panel de administración
│   │   ├── game/               # Componentes del juego (ruleta, preguntas)
│   │   ├── layout/             # Componentes de estructura (pantalla de reposo)
│   │   └── ui/                 # Componentes de interfaz de usuario
│   ├── store/                  # Estado global gestionado con Zustand
│   ├── lib/                    # Funciones de utilidad y hooks personalizados
│   ├── types/                  # Definiciones de tipos TypeScript
│   └── utils/                  # Funciones auxiliares
├── public/                     # Activos estáticos (sonidos, imágenes)
└── tailwind.config.ts         # Configuración de Tailwind (colores corporativos)
```

## Flujo de la Aplicación

1. **Pantalla de Reposo** (screensaver): Muestra video promocional y espera interacción
2. **Registro de Participante**: Captura datos del usuario antes de comenzar
3. **Ruleta**: El participante gira la ruleta para determinar la categoría de pregunta
4. **Pregunta**: Se muestra la pregunta según la categoría seleccionada
5. **Premio**: Se informa al participante del resultado y premio ganado
6. **Retorno a Pantalla de Reposo**: Tras un periodo de inactividad

## Características Técnicas Destacadas

- **Animación de Ruleta**: Implementación personalizada con Canvas y ecuaciones físicas de movimiento
- **Gestión de Estado**: Arquitectura basada en Zustand para manejo eficiente del estado global
- **Diseño Responsivo**: Interfaz adaptable mediante Tailwind CSS
- **Detección de Inactividad**: Retorno automático a pantalla de reposo para instalaciones sin supervisión
- **Persistencia de Datos**: Almacenamiento en Supabase para análisis posterior

## Administración del Sistema

La aplicación cuenta con un panel de administración que permite:

- Crear nuevas sesiones de juego con enlaces únicos
- Monitorear participantes en tiempo real
- Exportar resultados en formato Excel (XLSX)
- Gestionar el estado de las sesiones (activa, pausada, finalizada)

## Requisitos de Instalación

- Node.js 18.0 o superior
- NPM o Yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd roulette-game
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar las variables de entorno:
   - Crea un archivo `.env.local` en la raíz del proyecto
   - Añade las variables necesarias según el archivo CONFIGURACION.md

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Personalización

### Colores Corporativos

Los colores corporativos de DarSalud están configurados en `tailwind.config.ts`:

```javascript
colors: {
  "azul-intenso": "#192A6E",
  "verde-salud": "#5ACCC1",
  "celeste-medio": "#40C0EF",
  "amarillo-ds": "#F2BD35",
  "Rosado-lila": "#D5A7CD",
}
```

### Animación de la Ruleta

La física del movimiento de la ruleta se puede ajustar en `src/components/game/RouletteWheel.tsx` mediante las funciones `customEasingFunction` y `easeOutBounce`.

## Licencia

Este proyecto está bajo la licencia MIT.
