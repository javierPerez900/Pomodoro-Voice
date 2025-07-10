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
    // explanation: string;
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
Eres un asistente que configura temporizadores Pomodoro personalizados.

Tu única tarea es analizar cada instrucción del usuario (aunque sea vaga) y responder SIEMPRE en español con un objeto JSON que contenga exactamente estos campos:

- focusTime: minutos de trabajo.
- breakTime: minutos de descanso corto.
- maxCycles: cantidad de ciclos antes del descanso largo.
- longBreakTime: minutos de descanso largo.

Debes interpretar la instrucción del usuario y adaptar los valores según lo que diga.  
No proporciones explicaciones, comentarios ni texto adicional.  
Responde únicamente con el JSON de salida.

Ejemplo de respuesta:
{
  \"focusTime\": 25,
  \"breakTime\": 5,
  \"maxCycles\": 4,
  \"longBreakTime\": 15
}
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

  // Extrae solo el JSON de la respuesta
  const jsonStart = replyText.indexOf("{");
  const jsonEnd = replyText.lastIndexOf("}");

  // // Busca el primer '{' para separar explicación y JSON
  // const jsonStart = replyText.indexOf("{");
  // const jsonEnd = replyText.lastIndexOf("}");
  // if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
  // throw new Error("No se encontró el JSON en la respuesta de la IA.");
  // }

  
  // const explanation = replyText.slice(0, jsonStart).trim();
  // const jsonText = replyText.slice(jsonStart, jsonEnd + 1).trim();

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error("No se encontró un bloque JSON válido en la respuesta de la IA.");
  }

  const jsonText = replyText.slice(jsonStart, jsonEnd + 1).trim();

  // console.log("Explicación:", explanation);
  console.log("JSON:", jsonText);
  const config = JSON.parse(jsonText);
  
  return { config };
}