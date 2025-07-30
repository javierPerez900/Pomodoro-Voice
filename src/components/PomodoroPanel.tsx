import React from "react";

interface PomodoroPanelProps {
  config: { 
    focusTime: number; 
    breakTime: number; 
    maxCycles: number; 
    longBreakTime: number;
  };
  minutes: number;
  seconds: number;
  // timeLeft: number;
  isRunning: boolean;
  isFocusTime: boolean;
  startPomodoro: () => void;
  stopPomodoro: () => void;
  resetPomodoro: () => void;
  cycle: number;
}

export function PomodoroPanel({
  config,
  minutes,
  seconds,
  // timeLeft,
  isRunning,
  isFocusTime,
  startPomodoro,
  stopPomodoro,
  resetPomodoro,
  cycle,
}: PomodoroPanelProps) {

  const formatTime = (minutes: number, seconds: number,) => {
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  let estado = "";
  let estadoColor = "";

  if (isRunning) {
    if (isFocusTime) {
      estado = "Tiempo de trabajo";
      estadoColor = "text-sky-700 bg-sky-100 border-sky-300";
    } else if (cycle === config.maxCycles) {
      estado = "Descanso largo";
      estadoColor = "text-purple-700 bg-purple-100 border-purple-300";
    } else {
      estado = "Tiempo de descanso";
      estadoColor = "text-cyan-700 bg-cyan-100 border-cyan-300";
    }
  }
  
  return (
    <div className="bg-blue-50 rounded-xl p-16 shadow-inner flex flex-col items-center">
      <p className="text-md text-blue-500 mb-2">
        Ciclo: {cycle} / {config.maxCycles}
      </p>
      <p className={`text-lg font-semibold mb-2 flex items-center gap-2
  ${isRunning && isFocusTime ? "text-sky-700 bg-sky-100 px-2 py-1 rounded" : "text-sky-600"}`}>
        Tiempo de trabajo: {config.focusTime} minuto{config.focusTime === 1 ? "" : "s"}
      </p>
      <p className={`text-lg font-semibold mb-2 flex items-center gap-2
  ${isRunning && !isFocusTime && cycle < config.maxCycles ? "text-cyan-700 bg-cyan-100 px-2 py-1 rounded" : "text-cyan-600"}`}>
        Tiempo de descanso: {config.breakTime} minuto{config.breakTime === 1 ? "" : "s"}
      </p>
      <p className={`text-lg font-semibold mb-2 flex items-center gap-2
  ${isRunning && !isFocusTime && cycle === config.maxCycles ? "text-purple-700 bg-purple-100 px-2 py-1 rounded" : "text-purple-600"}`}>
        Descanso largo: {config.longBreakTime} minuto{config.longBreakTime === 1 ? "" : "s"}
      </p>
      {/* Reloj circular */}
      <div className="flex justify-center items-center mt-6 mb-1">
        <div className="w-56 h-56 rounded-full bg-white shadow-lg flex items-center justify-center border-8 border-blue-300">
          <span className="text-6xl font-mono text-blue-600 drop-shadow">
            {/*formatTime(timeLeft)*/}
            {formatTime(minutes, seconds)}
          </span>
        </div>
      </div>
      {/* Estado actual debajo del reloj */}
      {isRunning && (
        <div className={`mt-0 mb-3 text-sm font-bold px-4 py-1 rounded-full border ${estadoColor} shadow-sm transition-all`}>
          {estado}
        </div>
      )}
      <div className="mt-4 flex flex-col items-center gap-2">
        {!isRunning ? (
          <button
            onClick={startPomodoro}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold p-2 rounded w-32 shadow"
          >
            Iniciar
          </button>
        ) : (
          <button
            onClick={stopPomodoro}
            className="bg-red-500 hover:bg-red-600 text-white font-bold p-2 rounded w-32 shadow"
          >
            Detener
          </button>
        )}
        <button
            onClick={resetPomodoro}
            className="bg-yellow-400 hover:bg-yellow-600 text-white font-semibold p-1 rounded w-24 shadow text-sm mt-2"
        >
          Reiniciar
        </button>
      </div>
    </div>
  );
}