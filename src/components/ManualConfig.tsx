import React from "react";

interface ManualConfigProps {
  manualFocusTime: number;
  setManualFocusTime: (n: number) => void;
  manualBreakTime: number;
  setManualBreakTime: (n: number) => void;
  setManualConfig: () => void;
  setisIAUsed: (b: boolean) => void;
}

export function ManualConfig({
  manualFocusTime,
  setManualFocusTime,
  manualBreakTime,
  setManualBreakTime,
  setManualConfig,
  setisIAUsed,
}: ManualConfigProps) {
  return (
    <div className="manual-config">
      <label className="block mt-4 text-blue-800 font-semibold">
        Tiempo de trabajo (minutos):
        <input
          type="number"
          value={manualFocusTime}
          onChange={e => setManualFocusTime(Number(e.target.value))}
          className="border border-blue-300 rounded p-2 mt-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
          min="1"
        />
      </label>
      <label className="block mt-4 text-blue-800 font-semibold">
        Tiempo de descanso (minutos):
        <input
          type="number"
          value={manualBreakTime}
          onChange={e => setManualBreakTime(Number(e.target.value))}
          className="border border-blue-300 rounded p-2 mt-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
          min="1"
        />
      </label>
      <div className="mt-6 flex gap-2">
        <button
          onClick={setManualConfig}
          className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold p-2 rounded w-1/2 shadow"
        >
          Aplicar configuración manual
        </button>
        <button
          onClick={() => setisIAUsed(true)}
          className="bg-white border border-blue-400 text-blue-700 font-bold p-2 rounded w-1/2 hover:bg-blue-50 shadow"
        >
          Usar IA para configurar
        </button>
      </div>
    </div>
  );
}