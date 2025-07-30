"use client";
import { useRef, useEffect } from "react";
import { useTimer } from "react-timer-hook";
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
const finishSound = typeof window !== "undefined" ? new Audio("/sounds/guitar-finish-86787.mp3") : null;
if (finishSound) finishSound.volume = 1.0; // Volumen máximo


export default function VoicePomodoro() {
  const pomodoro = usePomodoro();
  const nextSeconds = useRef<number>(null);
  // const expiryRef = useRef<Date | null>(null);
  
  // Calcula el tiempo inicial para el timer
  const getInitialExpiry = () => {
    const expiry = new Date();

    if(pomodoro.config) {
      if(nextSeconds.current !== null){
        expiry.setSeconds(expiry.getSeconds() + nextSeconds.current);
      };

    }

    return expiry;
  };

  const advancePhase = () => {
    if (!pomodoro.config) return;
    const { focusTime, breakTime, longBreakTime, maxCycles } = pomodoro.config;

    // let nextSeconds: number;

    if (pomodoro.isFocusTime) {
      workEndSound?.play();
      pomodoro.setStatus(POMODORO_STATUS.DESCANSO);

      // nextSeconds = (pomodoro.cycle < maxCycles ? breakTime : longBreakTime) * 60;
      nextSeconds.current = (pomodoro.cycle < maxCycles ? breakTime : longBreakTime) * 60;
      pomodoro.setIsFocusTime(false);
      pomodoro.setNextPhase("break time"); // Indica que ha habido un cambio de fase
      console.log("tiempo de trabajo finalizado");
    } else {
      if (pomodoro.cycle < maxCycles) {
        breakEndSound?.play();
        pomodoro.setStatus(POMODORO_STATUS.TRABAJO);
        pomodoro.setIsFocusTime(true);
        pomodoro.setCycle(pomodoro.cycle + 1);
        pomodoro.setNextPhase("focus time"); // Indica que ha habido un cambio de fase
        nextSeconds.current = focusTime * 60;
        console.log("tiempo de descanso finalizado");
      } else {
        finishSound?.play();
        pomodoro.setStatus(POMODORO_STATUS.DESCANSO_LARGO);
        pomodoro.setCycle(1);
        pomodoro.setIsFocusTime(true);
        pomodoro.setNextPhase("inicio de un nuevo proceso"); 
        // nextSeconds = 0;
        nextSeconds.current = focusTime * 60
        console.log("tiempo de descanso largo finalizado");
      }
    }

    console.log("FUERA del condicional de advancePhase, isFocusTime:", pomodoro.isFocusTime);

    // if(nextSeconds == 0) {
    //   console.log("Pomodoro finalizado");
    //   pause();
    // }

  };

  const {
    seconds,
    minutes,
    isRunning,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp: getInitialExpiry(),
    autoStart: false,
    onExpire: advancePhase,
  });


   //Sincroniza pomodoro.timeLeft con el timer
  // useEffect(() => {
  //   const fecha1 = new Date('2025-07-17T14:00:00');
  //   const fecha2 = new Date('2025-07-17T14:45:30');

  //   const diferenciaMs = fecha2 - fecha1; // resultado: milisegundos
  //   console.log("Diferencia en milisegundos:", diferenciaMs);
  // }, [
  //    seconds, 
  //   ]);

  // Cuando se pase de fase, reinicia el timer
  useEffect(() => {
    if (pomodoro.config && pomodoro.nextPhase) {
      if(pomodoro.nextPhase === "inicio de un nuevo proceso"){

        if(nextSeconds.current === null) return;
        const expiry = new Date();
        expiry.setSeconds(expiry.getSeconds() + nextSeconds.current);
        restart(expiry, false);
      } else {

        if(nextSeconds.current === null) return;
        const expiry = new Date();
        expiry.setSeconds(expiry.getSeconds() + nextSeconds.current);
        // expiryRef.current = expiry;
        restart(expiry, true);
      }
    }
  }, [
    pomodoro.nextPhase,
   ]);



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
      pause();

      pomodoro.setStatus(POMODORO_STATUS.ESCUCHANDO);
      const voiceText = await voiceCapture();
      pomodoro.setTextCapturated(voiceText);

      pomodoro.setStatus(POMODORO_STATUS.PROCESANDO_IA);

      if (!pomodoro.model) {
        pomodoro.setStatus(POMODORO_STATUS.MODELO_NO_LISTO);
        return;
      }
      const webLLMResponse = await processTextWithWebLLM(voiceText, pomodoro.model);
      const { 
        // explanation: explanationResponse,
         config: configResponse } = webLLMResponse;

      pomodoro.setStatus(POMODORO_STATUS.CONFIGURANDO);

      // pomodoro.setExplanation(explanationResponse);
      const pomodoroConfig = configurePomodoro(configResponse);

      pomodoro.setConfig(pomodoroConfig);
      nextSeconds.current = pomodoroConfig.focusTime * 60
      const expiry = new Date();
      expiry.setSeconds(expiry.getSeconds() + nextSeconds.current);
      restart(expiry, false);

      pomodoro.setStatus(POMODORO_STATUS.CONFIGURADO);
    } catch (error) {
      pomodoro.setStatus(
        error instanceof Error ? POMODORO_STATUS.ERROR(error.message) : POMODORO_STATUS.ERROR_DESCONOCIDO
      );
    }
  };

  const startPomodoro = () => {

    resume()
    // const expiry = new Date();
    // if(nextSeconds.current !== null) return
    // expiry.setSeconds(expiry.getSeconds() + nextSeconds.current);
    // expiryRef.current = expiry;
    pomodoro.setStatus(POMODORO_STATUS.INICIADO);
  };

  const stopPomodoro = () => {
    pause();
    pomodoro.setStatus(POMODORO_STATUS.DETENIDO);
  };

  const resetPomodoro = () => {
    pomodoro.setStatus(POMODORO_STATUS.INICIAL);
    pomodoro.setCycle(1);
    pomodoro.setIsFocusTime(true);
    pomodoro.setNextPhase("");
    
    // Reiniciar el timer
    if(!pomodoro.config) return;
    // const seconds = pomodoro.config.focusTime * 60;
    nextSeconds.current = pomodoro.config.focusTime * 60;
    const expiry = new Date();
    expiry.setSeconds(expiry.getSeconds() + nextSeconds.current);
    restart(expiry, false);
  }

  const setManualConfig = () => {
    // Cambiar estado del Pomodoro
    pomodoro.setCycle(1);
    pomodoro.setIsFocusTime(true);
    pomodoro.setNextPhase("");
    console.log("setManualConfig, isFocusTime:", pomodoro.isFocusTime);
    const manualConfig = {
      focusTime: pomodoro.manualFocusTime,
      breakTime: pomodoro.manualBreakTime,
      maxCycles: pomodoro.manualMaxCycles,
      longBreakTime: pomodoro.manualLongBreakTime,
    };
    pomodoro.setConfig(manualConfig);
    console.log("setManualConfig, Configuración:", pomodoro.config);
    // pomodoro.setTimeLeft(manualConfig.focusTime * 60);
    pomodoro.setStatus(POMODORO_STATUS.MANUAL_APLICADA);
    
    if (!manualConfig) return;

    // const fullSeconds = manualConfig.focusTime * 60
    nextSeconds.current = manualConfig.focusTime * 60;
    const expiry = new Date();
    expiry.setSeconds(expiry.getSeconds() + nextSeconds.current);
    restart(expiry, false);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-cyan-200 to-blue-100">
      <div className={`pomodoro-timer w-full ${
    pomodoro.config
      ? "max-w-5xl flex-col md:flex-row gap-8"
      : "max-w-md flex-col"
  } bg-white/80 rounded-2xl shadow-2xl p-8 border border-blue-200 flex`}>
        <div className={`flex flex-col ${pomodoro.config ? "md:w-1/3" : "w-full"}`}>
          <h1 className="text-3xl font-bold text-sky-500 text-center mb-6 drop-shadow">Configura tu Pomodoro {!pomodoro.isIAUsed? "":"con tu voz"}</h1>

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
                minutes={minutes}
                seconds={seconds}
                // timeLeft={pomodoro.timeLeft}
                // isRunning={pomodoro.isRunning}
                isRunning={isRunning}
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

  