export async function voiceCapture(): Promise<string> {
  if (!("webkitSpeechRecognition" in window)) {
    throw new Error("Tu navegador no soporta la Web Speech API.");
  }

  return new Promise((resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
		recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
			recognition.stop();
      resolve(event.results[0][0].transcript);
    };

    recognition.onerror = (event) => {
			recognition.stop();
      reject(event.error);
    };

    recognition.start();
  });
}