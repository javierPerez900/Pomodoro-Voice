// Precise timer worker basado en timestamps (endTime).
// Recibe durations en segundos.

let timerId = null;
let endTimeMs = null;
let remainingMs = null;
let isPaused = true;

self.onmessage = (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case "START":
      startTimer(payload.duration);
      break;
    case "PAUSE":
      pauseTimer();
      break;
    case "RESUME":
      resumeTimer();
      break;
    case "RESET":
      resetTimer(payload.duration);
      break;
  }
};

function startTimer(durationSeconds) {
  // durationSeconds: número en segundos
  clearExistingTimer();

  const now = Date.now();
  endTimeMs = now + Math.max(0, Number(durationSeconds)) * 1000;
  isPaused = false;
  remainingMs = null;

  // Inmediato: postear un tick con el tiempo calculado
  scheduleTick();
}

function pauseTimer() {
  if (isPaused) return;
  isPaused = true;
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  if (endTimeMs !== null) {
    remainingMs = Math.max(0, endTimeMs - Date.now());
    endTimeMs = null;
  }
}

function resumeTimer() {
  if (!isPaused && endTimeMs) return;
  if (!remainingMs || remainingMs <= 0) return;

  isPaused = false;
  endTimeMs = Date.now() + remainingMs;
  remainingMs = null;
  scheduleTick();
}

function resetTimer(durationSeconds) {
  // Pone el timer en estado pausado con la duración proporcionada (no inicia)
  clearExistingTimer();
  isPaused = true;
  endTimeMs = null;
  remainingMs = Math.max(0, Number(durationSeconds)) * 1000;

  // Postear estado inmediato (UI se sincroniza con el valor)
  const secs = Math.ceil(remainingMs / 1000);
  self.postMessage({ type: "TICK", payload: { timeLeft: secs } });
}

function clearExistingTimer() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function scheduleTick() {
  clearExistingTimer();

  if (isPaused || endTimeMs === null) return;

  const now = Date.now();
  const msLeft = endTimeMs - now;
  const timeLeftSec = Math.ceil(msLeft / 1000);

  if (timeLeftSec <= 0) {
    // Finalizó
    self.postMessage({ type: "TICK", payload: { timeLeft: 0 } });
    self.postMessage({ type: "EXPIRED" });
    // Reiniciar estado interno
    endTimeMs = null;
    remainingMs = 0;
    isPaused = true;
    return;
  }

  // Enviar tick con el número de segundos restante (redondeado hacia arriba)
  self.postMessage({ type: "TICK", payload: { timeLeft: timeLeftSec } });

  // Calcular cuándo debemos ejecutar el próximo tick para alinearlo
  // Queremos que el "timeLeftSec" baje exactamente cuando cruce el próximo segundo.
  // msLeft = (timeLeftSec - 1)*1000 + remainder
  const nextIntervalMs = msLeft - (timeLeftSec - 1) * 1000;

  // Clamp del intervalo para evitar delays muy pequeños o muy grandes
  // nextIntervalMs típicamente estará en (0..1000], pero por seguridad:
  const delay = Math.max(100, Math.min(1000, Math.floor(nextIntervalMs)));

  timerId = setTimeout(scheduleTick, delay);
}
