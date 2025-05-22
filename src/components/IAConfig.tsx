import React from "react";

interface IAConfigProps {
  handleVoiceCommand: () => void;
  setisIAUsed: (b: boolean) => void;
}

export function IAConfig({ handleVoiceCommand, setisIAUsed, }: IAConfigProps) {
  return (
    <div className="mt-6 flex flex-col gap-2 items-center">
      <button
        onClick={handleVoiceCommand}
        className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold p-2 rounded w-full shadow"
      >
        Hablar
      </button>
      <button
        onClick={() => setisIAUsed(false)}
        className="bg-white border border-blue-400 text-blue-700 font-bold p-2 rounded w-full hover:bg-blue-50 shadow"
      >
        Regresar a configuración manual
      </button>
    </div>
  );
}