# Juego de Ruleta - DarSalud

Aplicación interactiva que simula una ruleta para seleccionar categorías de preguntas de manera aleatoria y atractiva para los usuarios.

## Características

- Ruleta interactiva 3D con efectos visuales
- Animación realista de giro con física de aceleración y desaceleración
- Efectos de sonido durante el giro y al seleccionar ganador
- Efectos visuales (confeti) al seleccionar un segmento
- Sistema de preguntas categorizado
- Formulario de registro de participantes
- Pantalla de reposo (screensaver) cuando no hay actividad

## Requisitos técnicos

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

3. Configurar los archivos de sonido:
   - Coloca los archivos de audio en la carpeta `/public/sounds/`
   - Se requieren los siguientes archivos:
     - `wheel-spin.mp3`: sonido para la rotación de la ruleta
     - `win-sound.mp3`: sonido para cuando la ruleta se detiene
   - Revisa `/public/sounds/README.md` para más información

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Estructura del proyecto

- `/src/components/game/RouletteWheel.tsx`: Componente principal de la ruleta
- `/src/store/gameStore.ts`: Estado global del juego usando Zustand
- `/public/sounds/`: Archivos de audio para efectos de sonido

## Personalización

### Colores de la ruleta

Los colores de los segmentos de la ruleta se definen en el archivo `RouletteWheel.tsx`:

```javascript
const baseColors = [
  '#FF5252', // Rojo
  '#FF9800', // Naranja
  '#FFEB3B', // Amarillo
  '#4CAF50', // Verde
  '#2196F3', // Azul
  '#9C27B0', // Púrpura
  '#E91E63', // Rosa
  '#00BCD4'  // Cian
];
```

### Animación y efectos

La animación de giro se personaliza mediante la función `customEasingFunction` y `easeOutBounce` que definen la física del movimiento.

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo LICENSE para más detalles.
