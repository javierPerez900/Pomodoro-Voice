// Puedes poner esto arriba en VoicePomodoro.tsx o en src/constants/pomodoroStatus.ts
export const POMODORO_STATUS = Object.freeze({
  INICIAL: "",
  CARGANDO_IA: "Cargando...",
  ESCUCHANDO: "Escuchando...",
  TEXTO_CAPTURADO: (texto: string) => `Texto capturado: "${texto}"`,
  PROCESANDO_IA: "Procesando con IA...",
  MODELO_NO_LISTO: "El modelo aún no está listo.",
  CONFIGURANDO: "Configurando Pomodoro...",
  CONFIGURADO: "¡Pomodoro configurado! Presiona iniciar para comenzar.",
  MANUAL_APLICADA: "¡Configuración manual aplicada! Presiona iniciar para comenzar.",
  INICIADO: "¡Pomodoro iniciado!",
  DETENIDO: "Pomodoro detenido.",
  DESCANSO: "¡Tiempo de descanso!",
  TRABAJO: "¡Tiempo de trabajo!",
  DESCANSO_LARGO: "¡Ciclo Pomodoro completo! Tómate un buen descanso.",
  ERROR: (msg: string) => `Error: ${msg}`,
  ERROR_DESCONOCIDO: "Error desconocido",
});