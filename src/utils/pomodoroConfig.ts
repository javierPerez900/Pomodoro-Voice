export function configurePomodoro(response: { focusTime: number; breakTime: number }) {
  

  if (typeof response.focusTime !== "number" || typeof response.breakTime !== "number") {
    throw new Error("No se pudo interpretar la configuración del Pomodoro.");
  }

  return {
    focusTime: response.focusTime,
    breakTime: response.breakTime,
  };
}