"use client";
import { useRef, useEffect, useCallback } from "react";
import { voiceCapture } from "../utils/voiceCapture";
import {
  processTextWithWebLLM,
  loadModel,
} from "../utils/processTextWithWebLLM";
import { configurePomodoro } from "../utils/pomodoroConfig";
import { POMODORO_STATUS } from "../constants/pomodoroStatus";
import { ManualConfig } from "./ManualConfig";
import { IAConfig } from "./IAConfig";
import { PomodoroPanel } from "./PomodoroPanel";
import { usePomodoroState } from "../hooks/usePomodoroState";
import { StatusPanel } from "./StatusPanel";

const workEndSound =
  typeof window !== "undefined"
    ? new Audio("/sounds/mixkit-completion-of-a-level-2063.wav")
    : null;
const breakEndSound =
  typeof window !== "undefined"
    ? new Audio("/sounds/mixkit-race-countdown-1953.wav")
    : null;
const finishSound =
  typeof window !== "undefined"
    ? new Audio("/sounds/guitar-finish-86787.mp3")
    : null;
if (finishSound) finishSound.volume = 1.0; // Volumen máximo

export default function VoicePomodoro() {
  const pomodoro = usePomodoroState();
  const workerRef = useRef<Worker | null>(null);
  const advancePhaseRef = useRef<(() => void) | null>(null);

  // Funciones del web worker
  const startTimer = (duration: number) => {
    // duration en segundos
    // Setear timeLeft inmediatamente para la UI
    pomodoro.setTimeLeft(duration);

    workerRef.current?.postMessage({
      type: "START",
      payload: { duration },
    });
    pomodoro.setIsRunning(true);
  };

  const pauseTimer = () => {
    workerRef.current?.postMessage({ type: "PAUSE" });
    pomodoro.setIsRunning(false);
  };

  const resumeTimer = () => {
    workerRef.current?.postMessage({ type: "RESUME" });
    pomodoro.setIsRunning(true);
  };

  const resetTimer = (duration: number) => {
    // duration en segundos
    workerRef.current?.postMessage({
      type: "RESET",
      payload: { duration },
    });
    // Actualizar UI al valor reiniciado (pausado)
    pomodoro.setTimeLeft(duration);
    pomodoro.setIsRunning(false);
  };

  const advancePhase = useCallback(() => {
    if (!pomodoro.config) return;
    const { focusTime, breakTime, longBreakTime, maxCycles } = pomodoro.config;

    let nextSeconds: number;
    let shouldContinue = true;

    if (pomodoro.isFocusTime) {
      // Fin del tiempo de trabajo
      workEndSound?.play();

      // Verificar si es el último ciclo antes del descanso largo
      if (pomodoro.cycle >= maxCycles) {
        pomodoro.setStatus(POMODORO_STATUS.DESCANSO_LARGO);
        nextSeconds = longBreakTime * 60;
      } else {
        pomodoro.setStatus(POMODORO_STATUS.DESCANSO);
        nextSeconds = breakTime * 60;
      }

      pomodoro.setIsFocusTime(false);
      pomodoro.setNextPhase("break time");
    } else {
      // Fin del descanso
      if (pomodoro.cycle < maxCycles) {
        // Descanso corto terminado, siguiente ciclo
        breakEndSound?.play();
        pomodoro.setStatus(POMODORO_STATUS.TRABAJO);
        pomodoro.setIsFocusTime(true);
        pomodoro.setCycle(pomodoro.cycle + 1);
        pomodoro.setNextPhase("focus time");
        nextSeconds = focusTime * 60;
      } else {
        // Todos los ciclos completados
        finishSound?.play();
        pomodoro.setStatus(POMODORO_STATUS.COMPLETADO);
        pomodoro.setCycle(1);
        pomodoro.setIsFocusTime(true);
        pomodoro.setNextPhase("completado");
        nextSeconds = focusTime * 60;
        shouldContinue = false; // No continuar automáticamente

        // Resetear pero no iniciar
        resetTimer(nextSeconds);
      }
    }

    // Solo iniciar el siguiente período si no hemos completado todos los ciclos
    if (shouldContinue) {
      startTimer(nextSeconds);
    }
  }, [pomodoro.config, pomodoro.isFocusTime, pomodoro.cycle]);

  useEffect(() => {
    advancePhaseRef.current = advancePhase;
  }, [advancePhase]);

  // Inicializar el web worker
  useEffect(() => {
    // Crear el worker
    workerRef.current = new Worker(
      new URL("../workers/timerWorker.js", import.meta.url)
    );

    // Configurar los listeners
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;

      switch (type) {
        case "TICK":
          // payload.timeLeft en segundos (entero)
          pomodoro.setTimeLeft(payload.timeLeft);
          break;
        case "EXPIRED":
          // Llamar a la función a través de la referencia
          if (advancePhaseRef.current) {
            advancePhaseRef.current();
          }
          break;
      }
    };

    // Limpiar el worker
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Reinicia el Pomodoro al cambiar el uso de IA
  useEffect(() => {
    stopPomodoro();
    pomodoro.setTextCapturated("");
    pomodoro.setExplanation("");

    // Reiniciar estado del Pomodoro
    pomodoro.setConfig(null);
    pomodoro.setCycle(1);
    pomodoro.setIsFocusTime(true);
    pomodoro.setNextPhase("");

    if (pomodoro.isIAUsed && !pomodoro.model) {
      //Carga el modelo IA
      pomodoro.setStatus(POMODORO_STATUS.CARGANDO_IA);
      const initializeModel = async () => {
        const loadedModel = await loadModel(
          pomodoro.setProgress,
          pomodoro.setProgressEnd
        );
        pomodoro.setStatus(POMODORO_STATUS.INICIAL);
        pomodoro.setModel(loadedModel);
      };
      initializeModel();
    } else {
      pomodoro.setStatus(POMODORO_STATUS.INICIAL);
    }
  }, [pomodoro.isIAUsed]);

  const handleVoiceCommand = async () => {
    try {
      stopPomodoro();
      pomodoro.setTextCapturated("");
      pomodoro.setExplanation("");

      // Reiniciar estado del Pomodoro
      pomodoro.setConfig(null);
      pomodoro.setCycle(1);
      pomodoro.setIsFocusTime(true);
      pomodoro.setNextPhase("");

      pomodoro.setStatus(POMODORO_STATUS.ESCUCHANDO);
      const voiceText = await voiceCapture();
      pomodoro.setTextCapturated(voiceText);

      pomodoro.setStatus(POMODORO_STATUS.PROCESANDO_IA);

      if (!pomodoro.model) {
        pomodoro.setStatus(POMODORO_STATUS.MODELO_NO_LISTO);
        return;
      }
      const webLLMResponse = await processTextWithWebLLM(
        voiceText,
        pomodoro.model
      );
      const {
        // explanation: explanationResponse,
        config: configResponse,
      } = webLLMResponse;

      pomodoro.setStatus(POMODORO_STATUS.CONFIGURANDO);

      // pomodoro.setExplanation(explanationResponse);
      const pomodoroConfig = configurePomodoro(configResponse);
      pomodoro.setConfig(pomodoroConfig);

      // Configurar el timer inicial con el tiempo de trabajo
      const initialDuration = pomodoroConfig.focusTime * 60;
      resetTimer(initialDuration);

      pomodoro.setStatus(POMODORO_STATUS.CONFIGURADO);
    } catch (error) {
      pomodoro.setStatus(
        error instanceof Error
          ? POMODORO_STATUS.ERROR(error.message)
          : POMODORO_STATUS.ERROR_DESCONOCIDO
      );
    }
  };

  const startPomodoro = () => {
    if (!pomodoro.config) return;

    if (pomodoro.timeLeft > 0 && !pomodoro.isRunning) {
      resumeTimer();
      pomodoro.setStatus(POMODORO_STATUS.REANUDADO);
    } else if (pomodoro.timeLeft === 0) {
      // Si no hay tiempo, calculamos la duración apropiada e iniciamos desde cero
      const duration = pomodoro.isFocusTime
        ? pomodoro.config.focusTime * 60
        : pomodoro.cycle === pomodoro.config.maxCycles
        ? pomodoro.config.longBreakTime * 60
        : pomodoro.config.breakTime * 60;

      startTimer(duration);
      pomodoro.setStatus(POMODORO_STATUS.INICIADO);
    }
  };

  const stopPomodoro = () => {
    pauseTimer();
    pomodoro.setStatus(POMODORO_STATUS.DETENIDO);
  };

  const resetPomodoro = () => {
    if (!pomodoro.config) return;

    pomodoro.setStatus(POMODORO_STATUS.INICIAL);
    pomodoro.setCycle(1);
    pomodoro.setIsFocusTime(true);
    pomodoro.setNextPhase("");

    // Reiniciar el timer al tiempo de trabajo inicial
    const initialDuration = pomodoro.config.focusTime * 60;
    resetTimer(initialDuration);
  };

  const setManualConfig = () => {
    // Cambiar estado del Pomodoro
    pomodoro.setCycle(1);
    pomodoro.setIsFocusTime(true);
    pomodoro.setNextPhase("");

    const manualConfig = {
      focusTime: pomodoro.manualFocusTime,
      breakTime: pomodoro.manualBreakTime,
      maxCycles: pomodoro.manualMaxCycles,
      longBreakTime: pomodoro.manualLongBreakTime,
    };

    pomodoro.setConfig(manualConfig);
    pomodoro.setStatus(POMODORO_STATUS.MANUAL_APLICADA);

    // Configurar el timer inicial con el tiempo de trabajo
    const initialDuration = manualConfig.focusTime * 60;
    resetTimer(initialDuration);
  };

  // Helpers para formatear el tiempo
  const getMinutes = () => Math.floor(pomodoro.timeLeft / 60);
  const getSeconds = () => pomodoro.timeLeft % 60;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-cyan-200 to-blue-100">
      <div
        className={`pomodoro-timer w-full ${
          pomodoro.config
            ? "max-w-5xl flex-col md:flex-row gap-8"
            : "max-w-md flex-col"
        } bg-white/80 rounded-2xl shadow-2xl p-8 border border-blue-200 flex`}
      >
        <div
          className={`flex flex-col ${pomodoro.config ? "md:w-1/3" : "w-full"}`}
        >
          <h1 className="text-3xl font-bold text-sky-500 text-center mb-6 drop-shadow">
            Configura tu Pomodoro {!pomodoro.isIAUsed ? "" : "con tu voz"}
          </h1>

          {!pomodoro.isIAUsed && (
            <ManualConfig
              manualFocusTime={pomodoro.manualFocusTime}
              setManualFocusTime={pomodoro.setManualFocusTime}
              manualBreakTime={pomodoro.manualBreakTime}
              setManualBreakTime={pomodoro.setManualBreakTime}
              manualMaxCycles={pomodoro.manualMaxCycles}
              setManualMaxCycles={pomodoro.setManualMaxCycles}
              manualLongBreakTime={pomodoro.manualLongBreakTime}
              setManualLongBreakTime={pomodoro.setManualLongBreakTime}
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
            explanation={pomodoro.explanation}
            textoCapturated={pomodoro.textCapturated}
            config={pomodoro.config}
            status={pomodoro.status}
            isIAUsed={pomodoro.isIAUsed}
            progressEnd={pomodoro.progressEnd}
            progress={pomodoro.progress}
          />
        </div>

        {pomodoro.config && (
          <div className="flex-1 flex items-start justify-center">
            <div className="w-full md:w-[420px] lg:w-[500px]">
              <PomodoroPanel
                config={pomodoro.config}
                minutes={getMinutes()}
                seconds={getSeconds()}
                isRunning={pomodoro.isRunning}
                isFocusTime={pomodoro.isFocusTime}
                startPomodoro={startPomodoro}
                stopPomodoro={stopPomodoro}
                resetPomodoro={resetPomodoro}
                cycle={pomodoro.cycle}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
