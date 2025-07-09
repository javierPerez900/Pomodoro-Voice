import { CreateMLCEngine, MLCEngine, InitProgressReport, ChatCompletionMessageParam } from "@mlc-ai/web-llm";

export async function loadModel(onProgress: (progress: string) => void, onProgressEnd: (ProgressEnd: boolean) => void) {
  const initProgressCallback = (initProgress: InitProgressReport ) => {
    onProgress(initProgress.text)
    if(initProgress.progress == 1){
      onProgressEnd(true);
    }
	}	

  const selectedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC"; // Modelo de WebLLM a utilizar
  // Inicializar el modelo de WebLLM
  const engine = await CreateMLCEngine(selectedModel, { initProgressCallback: initProgressCallback });

  return engine;
}

export async function processTextWithWebLLM(
  prompt: string,
  engine: MLCEngine
): Promise<{ 
    explanation: string;
    config: {
      focusTime: number;
      breakTime: number; 
      maxCycles: number; 
      longBreakTime: number 
    };
  }> {

  const messages: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content:  `
Eres un asistente que configura temporizadores Pomodoro.
Cuando recibas una instrucción del usuario, debes analizarla y responder en español con:

1. Una breve explicación de la configuración sugerida (máximo 3 líneas).
2. Luego, en una nueva línea, el objeto JSON con los siguientes campos:

- focusTime: minutos de trabajo.
- breakTime: minutos de descanso corto.
- maxCycles: cantidad de ciclos antes del descanso largo.
- longBreakTime: minutos de descanso largo.

Ejemplo de respuesta:
Esta configuración te permitirá trabajar en bloques de 25 minutos con descansos cortos y un descanso largo al final.
{
  "focusTime": 25,
  "breakTime": 5,
  "maxCycles": 4,
  "longBreakTime": 15
}

NO agregues texto después del JSON.
`,
  },
  {
    role: "user",
    content: prompt,
  }
];

  const fullReply = await engine.chat.completions.create({
    messages,
    temperature: 0.7,
  });
  const replyText = fullReply.choices[0].message.content;

  
  if (!replyText) {
    throw new Error("La IA no devolvió una respuesta válida.");
  }
  console.log("Respuesta de la IA:", replyText);

  // Busca el primer '{' para separar explicación y JSON
  const jsonStart = replyText.indexOf("{");
  const jsonEnd = replyText.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
  throw new Error("No se encontró el JSON en la respuesta de la IA.");
  }

  
  const explanation = replyText.slice(0, jsonStart).trim();
  const jsonText = replyText.slice(jsonStart, jsonEnd + 1).trim();

  console.log("Explicación:", explanation);
  console.log("JSON:", jsonText);
  const config = JSON.parse(jsonText);
  
  return { explanation, config };
}