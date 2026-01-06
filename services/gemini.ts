
import { GoogleGenAI, Type } from "@google/genai";
import { Side, Debater, CoachAnalysis, Message, Source } from "../types";

export const getDebaterResponse = async (
  topic: string,
  debater: Debater,
  aiSide: Side,
  history: Message[],
  context?: string
): Promise<{ text: string, sources?: Source[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sideText = aiSide === Side.PRO ? '正方' : '反方';
  
  const systemInstruction = `你现在是著名辩手 ${debater.name}。
  你的辩论风格是：${debater.style}。
  当前辩题：${topic}。
  你的立场：${sideText}。
  
  【指令】：
  1. 【沉浸感】：语气要有呼吸感，不要像机器人。
  2. 【故事性】：引用生动事例。
  3. 【金句】：每段发言末尾要有一句振聋发聩的金句。
  4. 【限制】：字数在 400 字以内，多用短句。`;

  let messagesPayload: any[] = history
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'ai' ? 'model' : 'user' as const,
      parts: [{ text: `${m.senderName} (${m.side === Side.PRO ? '正方' : '反方'}): ${m.content}` }]
    }));

  if (messagesPayload.length === 0) {
    messagesPayload = [{ role: 'user', parts: [{ text: `请作为${sideText}开始你的辩论开场陈词。` }] }];
  } else {
    // 确保消息交替并针对性提问
    if (messagesPayload[messagesPayload.length - 1].role === 'model') {
       messagesPayload.push({ role: 'user', parts: [{ text: "请针对以上战局，继续你的逻辑输出。" }] });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messagesPayload,
      config: { systemInstruction, temperature: 0.8, tools: [{ googleSearch: {} }] }
    });

    const candidate = response.candidates?.[0];
    let sources: Source[] = [];
    if (candidate?.groundingMetadata?.groundingChunks) {
      sources = candidate.groundingMetadata.groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({ uri: chunk.web!.uri, title: chunk.web!.title || '参考来源' }));
    }
    return { text: response.text || "我正在整理思绪...", sources };
  } catch (error) {
    return { text: "由于逻辑回路波动，请允许我重新组织语言。" };
  }
};

export const getCoachAnalysis = async (
  topic: string,
  userSide: Side,
  lastUserMsg: string,
  lastOpponentMsg: string
): Promise<CoachAnalysis | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sideText = userSide === Side.PRO ? '正方' : '反方';

  const systemInstruction = `你现在是顶级辩论教练“思辨分析师”。你的任务是实时剖析战局。
  1. userLogic: 提炼用户的核心逻辑。
  2. opponentLogic: 剖析对手的核心漏洞。
  3. rebuttalStrategies: 提供 2-3 条反击路径。
  4. goldenSentences: 提供 2-3 句高级金句。
  5. slangOrMeme: 提供一句当下流行的梗用于解构对方。
  6. supportRate: 胜算评估 (0-100)。`;

  const prompt = `辩题：${topic}\n用户立场：${sideText}\n用户发言：${lastUserMsg}\n对手发言：${lastOpponentMsg}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            userLogic: { type: Type.STRING },
            opponentLogic: { type: Type.STRING },
            rebuttalStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
            goldenSentences: { type: Type.ARRAY, items: { type: Type.STRING } },
            slangOrMeme: { type: Type.STRING },
            supportRate: { type: Type.NUMBER }
          },
          required: ["userLogic", "opponentLogic", "rebuttalStrategies", "goldenSentences", "slangOrMeme", "supportRate"]
        }
      }
    });
    return { ...JSON.parse(response.text.trim()), timestamp: Date.now() };
  } catch (error) {
    return null;
  }
};
