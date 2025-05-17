"use client";
import { useEffect, useState } from "react";
import { voiceCapture } from "../utils/voiceCapture";
import { processTextWithWebLLM, loadModel } from "../utils/processTextWithWebLLM";
import { configurePomodoro } from "../utils/pomodoroConfig";
import { MLCEngine} from "@mlc-ai/web-llm";

const workEndSound = typeof window !== "undefined" ? new Audio("/sounds/mixkit-completion-of-a-level-2063.wav") : null;
const breakEndSound = typeof window !== "undefined" ? new Audio("/sounds/mixkit-race-countdown-1953.wav") : null;

export default function VoicePomodoro() {
  const [status, setStatus] = useState<string>("Esperando...");
  const [progress, setProgress] = useState<string>(""); // Estado para el progreso
  const [progressEnd, setProgressEnd] = useState<boolean>(false);
  const [config, setConfig] = useState<{ focusTime: number; breakTime: number } | null>(null);
  const [model, setModel] = useState<MLCEngine | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // Tiempo restante en segundos
  const [isRunning, setIsRunning] = useState<boolean>(false); // Si el temporizador está corriendo
  const [isFocusTime, setIsFocusTime] = useState<boolean>(true); // Si es tiempo de trabajo
  const [manualFocusTime, setManualFocusTime] = useState<number>(25); // Tiempo de trabajo manual
  const [manualBreakTime, setManualBreakTime] = useState<number>(5); // Tiempo de descanso manual
  const [isIAUsed, setisIAUsed] = useState<boolean>(false);

  useEffect(() => {
    if(isIAUsed){
      const initializeModel = async () => {
      const loadedModel = await loadModel(setProgress, setProgressEnd);
      setModel(loadedModel);
      };
      initializeModel();
    }
  },[isIAUsed]);

  useEffect(() => {
    if (!isRunning || !config) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);

          if (isFocusTime) {
            workEndSound?.play();
            setStatus("¡Tiempo de descanso!");
            setIsFocusTime(false);
            return (config.breakTime || 0) * 60;
          } else {
            breakEndSound?.play();
            setStatus("¡Tiempo de trabajo!");
            setIsFocusTime(true);
            return (config.focusTime || 0) * 60;
          }
        }

        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, config, isFocusTime]);

  const handleVoiceCommand = async () => {
    try {
      setStatus("Escuchando...");
      const voiceText = await voiceCapture();
      setStatus(`Texto capturado: "${voiceText}"`);

      setStatus("Procesando con IA...");

      if (!model) {
        setStatus("El modelo aún no está listo.");
        return;
      }
      const webLLMResponse = await processTextWithWebLLM(voiceText, model);

      setStatus("Configurando Pomodoro...");
      const pomodoroConfig = configurePomodoro(webLLMResponse);
      setConfig(pomodoroConfig);

      setStatus("¡Pomodoro configurado! Presiona iniciar para comenzar.");
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus("Error desconocido");
      }
    }
  };

  const startPomodoro = () => {
    if (config) {
      setTimeLeft(config.focusTime * 60); // Configurar el tiempo de trabajo inicial
      setIsRunning(true);
      setIsFocusTime(true);
      setStatus("¡Pomodoro iniciado! Tiempo de trabajo.");
    }
  };

  const stopPomodoro = () => {
    setIsRunning(false);
    setStatus("Pomodoro detenido.");
  };

  const setManualConfig = () => {
    const manualConfig = {
      focusTime: manualFocusTime,
      breakTime: manualBreakTime,
    };
    setConfig(manualConfig);
    setStatus("¡Configuración manual aplicada! Presiona iniciar para comenzar.");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="voice-pomodoro">
      <h1 className="text-2xl font-bold">Configura tu Pomodoro {!isIAUsed? "":"con tu voz"}</h1>

      {!isIAUsed && !config && (
        <div className="manual-config">
          <label className="block mt-4">
            Tiempo de trabajo (minutos):
            <input
              type="number"
              value={manualFocusTime}
              onChange={(e) => setManualFocusTime(Number(e.target.value))}
              className="border rounded p-2 mt-2"
              min="1"
            />
          </label>
          <label className="block mt-4">
            Tiempo de descanso (minutos):
            <input
              type="number"
              value={manualBreakTime}
              onChange={(e) => setManualBreakTime(Number(e.target.value))}
              className="border rounded p-2 mt-2"
              min="1"
            />
          </label>
          <div className="mt-4">
            <button
              onClick={setManualConfig}
              className="bg-green-500 text-white p-2 rounded mr-2"
            >
              Aplicar configuración manual
            </button>
            <button
              onClick={() => {
                setisIAUsed(true);
              }}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Usar IA para configurar
            </button>
          </div>
        </div>
      )}
      
      {isIAUsed && progressEnd && <button
        onClick={handleVoiceCommand}
        className="bg-blue-500 text-white p-2 rounded mt-4"
      >
        Hablar
      </button>}
      <p className="mt-4">{status}</p>
      {isIAUsed && !progressEnd && progress && <p className="mt-2 text-sm text-gray-500">Progreso: {progress}</p>} {/* Mostrar progreso */}
      {config && (
        <div className="mt-4">
          <p>Tiempo de trabajo: {config.focusTime} minutos</p>
          <p>Tiempo de descanso: {config.breakTime} minutos</p>
          <p>Tiempo restante: {formatTime(timeLeft)}</p>

          <div className="mt-4">
            {!isRunning ? (
              <button
                onClick={startPomodoro}
                className="bg-green-500 text-white p-2 rounded"
              >
                Iniciar
              </button>
            ) : (
              <button
                onClick={stopPomodoro}
                className="bg-red-500 text-white p-2 rounded"
              >
                Detener
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}