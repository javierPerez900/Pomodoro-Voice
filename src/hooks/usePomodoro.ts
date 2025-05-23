import { useState } from "react";
import { MLCEngine } from "@mlc-ai/web-llm";


export function usePomodoro() {
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const [progressEnd, setProgressEnd] = useState<boolean>(false);
  const [config, setConfig] = useState<{ focusTime: number; breakTime: number } | null>(null);
  const [model, setModel] = useState<MLCEngine | null>(null);
  const [textCapturated, setTextCapturated] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFocusTime, setIsFocusTime] = useState<boolean>(true);
  const [manualFocusTime, setManualFocusTime] = useState<number>(25);
  const [manualBreakTime, setManualBreakTime] = useState<number>(5);
  const [isIAUsed, setisIAUsed] = useState<boolean>(false);
  


  return {
    status, setStatus,
    progress, setProgress,
    progressEnd, setProgressEnd,
    config, setConfig,
    model, setModel,
    textCapturated, setTextCapturated,
    timeLeft, setTimeLeft,
    isRunning, setIsRunning,
    isFocusTime, setIsFocusTime,
    manualFocusTime, setManualFocusTime,
    manualBreakTime, setManualBreakTime,
    isIAUsed, setisIAUsed,
  };
}