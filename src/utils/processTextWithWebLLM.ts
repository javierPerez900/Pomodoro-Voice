import { CreateMLCEngine, MLCEngine, InitProgressReport, ChatCompletionMessageParam } from "@mlc-ai/web-llm";

export async function loadModel(onProgress: (progress: string) => void, onProgressEnd: (ProgressEnd: boolean) => void) {
  const initProgressCallback = (initProgress: InitProgressReport ) => {
    onProgress(initProgress.text)
    console.log(initProgress);
    if(initProgress.progress == 1){
      onProgressEnd(true);
    }
	}	

  const selectedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC"; // Modelo de WebLLM a utilizar
  // Inicializar el modelo de WebLLM
  const engine = await CreateMLCEngine(selectedModel, { initProgressCallback: initProgressCallback });
  console.log(typeof engine);
  console.log(engine);
  return engine;
}

export async function processTextWithWebLLM(prompt: string, engine: MLCEngine
): Promise<{ focusTime: number; breakTime: number }> {

  const messages: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: `
Eres un asistente que configura temporizadores Pomodoro. 
Cuando recibas una instrucción del usuario, debes analizarla y responder EXCLUSIVAMENTE un objeto JSON con los siguientes campos:

- focusTime: minutos de trabajo.
- breakTime: minutos de descanso corto.

Ejemplo de respuesta:
{
  "focusTime": 25,
  "breakTime": 5
}

NO agregues ninguna explicación ni texto extra. Solo responde el JSON.`,
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
  console.log("Esta es la respuesta", replyText);
  
  if (!replyText) {
    throw new Error("La IA no devolvió una respuesta válida.");
  }
  const cleanedReply = replyText.replace(/^[^{]*|[^}]*$/g, "").trim();

  const config = JSON.parse(cleanedReply);
  console.log(config);
  return config;
}