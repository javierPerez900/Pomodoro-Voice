"use client";
import { useEffect, useState } from "react";
import { voiceCapture } from "../utils/voiceCapture";
import { processTextWithWebLLM, loadModel } from "../utils/processTextWithWebLLM";
import { configurePomodoro } from "../utils/pomodoroConfig";
import { POMODORO_STATUS } from "../constants/pomodoroStatus";
import { MLCEngine} from "@mlc-ai/web-llm";

const workEndSound = typeof window !== "undefined" ? new Audio("/sounds/mixkit-completion-of-a-level-2063.wav") : null;
const breakEndSound = typeof window !== "undefined" ? new Audio("/sounds/mixkit-race-countdown-1953.wav") : null;

export default function VoicePomodoro() {
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<string>(""); // Estado para el progreso
  const [progressEnd, setProgressEnd] = useState<boolean>(false);
  const [config, setConfig] = useState<{ focusTime: number; breakTime: number } | null>(null);
  const [model, setModel] = useState<MLCEngine | null>(null);
  const [textoCapturated, setTextoCapturated] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0); // Tiempo restante en segundos
  const [isRunning, setIsRunning] = useState<boolean>(false); // Si el temporizador está corriendo
  const [isFocusTime, setIsFocusTime] = useState<boolean>(true); // Si es tiempo de trabajo
  const [manualFocusTime, setManualFocusTime] = useState<number>(25); // Tiempo de trabajo manual
  const [manualBreakTime, setManualBreakTime] = useState<number>(5); // Tiempo de descanso manual
  const [isIAUsed, setisIAUsed] = useState<boolean>(false);

  useEffect(() => {
    setConfig(null)
    if(isIAUsed && !model){
      setStatus(POMODORO_STATUS.CARGANDO_IA);
      const initializeModel = async () => {
      const loadedModel = await loadModel(setProgress, setProgressEnd);
      setStatus(POMODORO_STATUS.INICIAL);
      setModel(loadedModel);
      };
      initializeModel();
    } else {
      setStatus(POMODORO_STATUS.INICIAL);
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
            setStatus(POMODORO_STATUS.DESCANSO);
            setIsFocusTime(false);
            return (config.breakTime || 0) * 60;
          } else {
            breakEndSound?.play();
            setStatus(POMODORO_STATUS.TRABAJO);
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
      setStatus(POMODORO_STATUS.ESCUCHANDO);
      const voiceText = await voiceCapture();
      setTextoCapturated(voiceText);

      setStatus(POMODORO_STATUS.PROCESANDO_IA);

      if (!model) {
        setStatus(POMODORO_STATUS.MODELO_NO_LISTO);
        return;
      }
      const webLLMResponse = await processTextWithWebLLM(voiceText, model);

      setStatus(POMODORO_STATUS.CONFIGURANDO);
      const pomodoroConfig = configurePomodoro(webLLMResponse);
      setConfig(pomodoroConfig);

      setStatus(POMODORO_STATUS.CONFIGURADO);
    } catch (error) {
      if (error instanceof Error) {
        setStatus(POMODORO_STATUS.ERROR(error.message));
      } else {
        setStatus(POMODORO_STATUS.ERROR_DESCONOCIDO);
      }
    }
  };

  const startPomodoro = () => {
    if (config) {
      setTimeLeft(config.focusTime * 60); // Configurar el tiempo de trabajo inicial
      setIsRunning(true);
      setIsFocusTime(true);
      setStatus(POMODORO_STATUS.INICIADO);
    }
  };

  const stopPomodoro = () => {
    setIsRunning(false);
    setStatus(POMODORO_STATUS.DETENIDO);
  };

  const setManualConfig = () => {
    stopPomodoro();
    const manualConfig = {
      focusTime: manualFocusTime,
      breakTime: manualBreakTime,
    };
    setConfig(manualConfig);
    setStatus(POMODORO_STATUS.MANUAL_APLICADA);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-cyan-200 to-blue-100">
      <div className="pomodoro-timer w-full max-w-md bg-white/80 rounded-2xl shadow-2xl p-8 border border-blue-200">
        <h1 className="text-3xl font-bold text-blue-700 text-center mb-6 drop-shadow">Configura tu Pomodoro {!isIAUsed? "":"con tu voz"}</h1>

        {!isIAUsed && (
          <div className="manual-config">
            <label className="block mt-4 text-blue-800 font-semibold">
              Tiempo de trabajo (minutos):
              <input
                type="number"
                value={manualFocusTime}
                onChange={(e) => setManualFocusTime(Number(e.target.value))}
                className="border border-blue-300 rounded p-2 mt-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
                min="1"
              />
            </label>
            <label className="block mt-4 text-blue-800 font-semibold">
              Tiempo de descanso (minutos):
              <input
                type="number"
                value={manualBreakTime}
                onChange={(e) => setManualBreakTime(Number(e.target.value))}
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
                onClick={() => {setisIAUsed(true);}}
                className="bg-white border border-blue-400 text-blue-700 font-bold p-2 rounded w-1/2 hover:bg-blue-50 shadow"
              >
                Usar IA para configurar
              </button>
            </div>
          </div>
        )}
        
        {isIAUsed && progressEnd && (
          <div className="mt-6 flex flex-col gap-2 items-center">
            <button
              onClick={handleVoiceCommand}
              className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold p-2 rounded w-full shadow"
            >
              Hablar
            </button>
            <button
              onClick={() => {
                      setisIAUsed(false);
                    }}
              className="bg-white border border-blue-400 text-blue-700 font-bold p-2 rounded w-full hover:bg-blue-50 shadow"
            >
              Regresar a configuración manual
            </button>
          </div>
        )}

        {textoCapturated && !config && <p className="mt-6 text-center text-black-700 font-medium min-h-[2rem]">texto capturado: {textoCapturated}</p>}

        <p className="mt-6 text-center text-blue-700 font-medium min-h-[2rem]">{status}</p>
        {isIAUsed && !progressEnd && progress && <p className="mt-2 text-sm text-cyan-700 text-center">Progreso: {progress}</p>}

        {config && (
          <div className="mt-8 bg-blue-50 rounded-xl p-6 shadow-inner flex flex-col items-center">
            <p className="text-lg text-blue-800 font-semibold mb-2">Tiempo de trabajo: {config.focusTime} minutos</p>
            <p className="text-lg text-blue-800 font-semibold mb-2">Tiempo de descanso: {config.breakTime} minutos</p>
            <p className="text-5xl font-mono text-blue-600 my-4 drop-shadow">Tiempo restante: {formatTime(timeLeft)}</p>

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
        )}
      </div>
    </div>
  );
}