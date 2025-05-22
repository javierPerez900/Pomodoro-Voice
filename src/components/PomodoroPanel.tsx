import React from "react";

interface PomodoroPanelProps {
  config: { focusTime: number; breakTime: number };
  timeLeft: number;
  isRunning: boolean;
  startPomodoro: () => void;
  stopPomodoro: () => void;
  formatTime: (n: number) => string;
}

export function PomodoroPanel({
  config,
  timeLeft,
  isRunning,
  startPomodoro,
  stopPomodoro,
  formatTime,
}: PomodoroPanelProps) {
  return (
    <div className="mt-8 bg-blue-50 rounded-xl p-6 shadow-inner flex flex-col items-center">
      <p className="text-lg text-blue-800 font-semibold mb-2">
        Tiempo de trabajo: {config.focusTime} minutos
      </p>
      <p className="text-lg text-blue-800 font-semibold mb-2">
        Tiempo de descanso: {config.breakTime} minutos
      </p>
      <p className="text-5xl font-mono text-blue-600 my-4 drop-shadow">
        Tiempo restante: {formatTime(timeLeft)}
      </p>
      <div className="mt-4 flex gap-2">
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
      </div>
    </div>
  );
}