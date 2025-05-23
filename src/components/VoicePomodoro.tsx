"use client";
import { useEffect } from "react";
import { voiceCapture } from "../utils/voiceCapture";
import { processTextWithWebLLM, loadModel } from "../utils/processTextWithWebLLM";
import { configurePomodoro } from "../utils/pomodoroConfig";
import { POMODORO_STATUS } from "../constants/pomodoroStatus";
import { ManualConfig } from "./ManualConfig";
import { IAConfig } from "./IAConfig";
import { PomodoroPanel } from "./PomodoroPanel";
import { usePomodoro } from "../hooks/usePomodoro";
import { StatusPanel } from "./StatusPanel";

const workEndSound = typeof window !== "undefined" ? new Audio("/sounds/mixkit-completion-of-a-level-2063.wav") : null;
const breakEndSound = typeof window !== "undefined" ? new Audio("/sounds/mixkit-race-countdown-1953.wav") : null;

export default function VoicePomodoro() {
  const pomodoro = usePomodoro();

  useEffect(() => {
    stopPomodoro();
    pomodoro.setConfig(null);
    pomodoro.setTextCapturated("");
    // setConfig(null);
    // setTextoCapturated("");
    if(pomodoro.isIAUsed && !pomodoro.model){
      pomodoro.setStatus(POMODORO_STATUS.CARGANDO_IA);
      const initializeModel = async () => {
      const loadedModel = await loadModel(pomodoro.setProgress, pomodoro.setProgressEnd);
      pomodoro.setStatus(POMODORO_STATUS.INICIAL);
      pomodoro.setModel(loadedModel);
      };
      initializeModel();
    } else {
      pomodoro.setStatus(POMODORO_STATUS.INICIAL);
    }
  },[pomodoro.isIAUsed]);

  useEffect(() => {
    if (!pomodoro.isRunning || !pomodoro.config) return;

    const timer = setInterval(() => {
      pomodoro.setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);

          if (pomodoro.isFocusTime) {
            workEndSound?.play();
            pomodoro.setStatus(POMODORO_STATUS.DESCANSO);
            pomodoro.setIsFocusTime(false);
            return (pomodoro.config?.breakTime || 0) * 60;
          } else {
            breakEndSound?.play();
            pomodoro.setStatus(POMODORO_STATUS.TRABAJO);
            pomodoro.setIsFocusTime(true);
            return (pomodoro.config?.focusTime || 0) * 60;
          }
        }

        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pomodoro.isRunning, pomodoro.config, pomodoro.isFocusTime]);

  const handleVoiceCommand = async () => {
    try {
      pomodoro.setStatus(POMODORO_STATUS.ESCUCHANDO);
      const voiceText = await voiceCapture();
      pomodoro.setTextCapturated(voiceText);

      pomodoro.setStatus(POMODORO_STATUS.PROCESANDO_IA);

      if (!pomodoro.model) {
        pomodoro.setStatus(POMODORO_STATUS.MODELO_NO_LISTO);
        return;
      }
      const webLLMResponse = await processTextWithWebLLM(voiceText, pomodoro.model);

      pomodoro.setStatus(POMODORO_STATUS.CONFIGURANDO);
      const pomodoroConfig = configurePomodoro(webLLMResponse);
      pomodoro.setConfig(pomodoroConfig);

      pomodoro.setTimeLeft(pomodoroConfig.focusTime * 60);

      pomodoro.setStatus(POMODORO_STATUS.CONFIGURADO);
    } catch (error) {
      if (error instanceof Error) {
        pomodoro.setStatus(POMODORO_STATUS.ERROR(error.message));
      } else {
        pomodoro.setStatus(POMODORO_STATUS.ERROR_DESCONOCIDO);
      }
    }
  };

  const startPomodoro = () => {
    if (pomodoro.config) {
      if (pomodoro.timeLeft === 0) {
        pomodoro.setTimeLeft(pomodoro.config.focusTime * 60);
        pomodoro.setIsFocusTime(true);
      }
      pomodoro.setIsRunning(true);
      pomodoro.setStatus(POMODORO_STATUS.INICIADO);
    }
  };

  const stopPomodoro = () => {
    pomodoro.setIsRunning(false);
    pomodoro.setStatus(POMODORO_STATUS.DETENIDO);
  };

  const setManualConfig = () => {
    stopPomodoro();
    const manualConfig = {
      focusTime: pomodoro.manualFocusTime,
      breakTime: pomodoro.manualBreakTime,
    };
    pomodoro.setConfig(manualConfig);
    pomodoro.setTimeLeft(manualConfig.focusTime * 60);
    pomodoro.setStatus(POMODORO_STATUS.MANUAL_APLICADA);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-cyan-200 to-blue-100">
      <div className="pomodoro-timer w-full max-w-md bg-white/80 rounded-2xl shadow-2xl p-8 border border-blue-200">
        <h1 className="text-3xl font-bold text-blue-700 text-center mb-6 drop-shadow">Configura tu Pomodoro {!pomodoro.isIAUsed? "":"con tu voz"}</h1>

        {!pomodoro.isIAUsed && (
          <ManualConfig
            manualFocusTime={pomodoro.manualFocusTime}
            setManualFocusTime={pomodoro.setManualFocusTime}
            manualBreakTime={pomodoro.manualBreakTime}
            setManualBreakTime={pomodoro.setManualBreakTime}
            setManualConfig={setManualConfig}
            setisIAUsed={pomodoro.setisIAUsed}
          />
        )}
        
        {pomodoro.isIAUsed && pomodoro.progressEnd && (
          <IAConfig
            handleVoiceCommand={handleVoiceCommand}
            setisIAUsed={pomodoro.setisIAUsed}
          />
        )}

        <StatusPanel
          textoCapturated={pomodoro.textCapturated}
          config={pomodoro.config}
          status={pomodoro.status}
          isIAUsed={pomodoro.isIAUsed}
          progressEnd={pomodoro.progressEnd}
          progress={pomodoro.progress}
        />

        {pomodoro.config && (
          <PomodoroPanel
            config={pomodoro.config}
            timeLeft={pomodoro.timeLeft}
            isRunning={pomodoro.isRunning}
            startPomodoro={startPomodoro}
            stopPomodoro={stopPomodoro}
            formatTime={formatTime}
          />
        )}
      </div>
    </div>
  );
}