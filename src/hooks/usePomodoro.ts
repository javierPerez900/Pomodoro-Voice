import { useState } from "react";
import { MLCEngine } from "@mlc-ai/web-llm";


export function usePomodoro() {
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const [progressEnd, setProgressEnd] = useState<boolean>(false);
  const [config, setConfig] = useState<{ 
    focusTime: number;
    breakTime: number; 
    maxCycles: number; 
    longBreakTime: number; 
  } | null>(null);
  const [model, setModel] = useState<MLCEngine | null>(null);
  const [textCapturated, setTextCapturated] = useState<string>("");
  const [isFocusTime, setIsFocusTime] = useState<boolean>(true);
  const [nextPhase, setNextPhase] = useState<string>(""); // Indica si ha habido un cambio de fase
  const [manualFocusTime, setManualFocusTime] = useState<number>(25);
  const [manualBreakTime, setManualBreakTime] = useState<number>(5);
  const [manualMaxCycles, setManualMaxCycles] = useState<number>(4); // Número de ciclos antes del descanso largo
  const [manualLongBreakTime, setManualLongBreakTime] = useState<number>(15); // Descanso largo en minutos
  const [cycle, setCycle] = useState<number>(1); // Ciclo actual
  const [isIAUsed, setisIAUsed] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>("");
  
  


  return {
    status, setStatus,
    progress, setProgress,
    progressEnd, setProgressEnd,
    config, setConfig,
    model, setModel,
    textCapturated, setTextCapturated,
    isFocusTime, setIsFocusTime,
    nextPhase, setNextPhase,
    manualFocusTime, setManualFocusTime,
    manualBreakTime, setManualBreakTime,
    manualMaxCycles, setManualMaxCycles,
    manualLongBreakTime, setManualLongBreakTime,
    cycle, setCycle,
    isIAUsed, setisIAUsed,
    explanation, setExplanation,
  };
}