export function configurePomodoro(response: { 
  focusTime: number;
  breakTime: number;
  maxCycles: number;
  longBreakTime: number}) {
  

  if (typeof response.focusTime !== "number" 
    || typeof response.breakTime !== "number"
    || typeof response.maxCycles !== "number"
    || typeof response.longBreakTime !== "number") {
    throw new Error("No se pudo interpretar la configuración del Pomodoro.");
  }

  return {
    focusTime: response.focusTime,
    breakTime: response.breakTime,
    maxCycles: response.maxCycles,
    longBreakTime: response.longBreakTime,
  };
}