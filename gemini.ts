
import { GoogleGenAI, Type } from "@google/genai";
import { Side, Debater, CoachAnalysis, Message, Source } from "./types";

/**
 * 1. 获取 AI 生成的剧本辩题
 */
export const generateScenarioTopic = async (category: string): Promise<{ topic: string, context: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `你是一个天才编剧和辩论策划人。请根据主题领域“${category}”，创作一个极具冲突感的辩论背景。
  输出要求：
  1. context: 一段150字左右的背景叙述。
  2. topic: 提炼出一个“应不应该”或“是不是”的辩论题目。
  请用中文输出 JSON 格式。`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            context: { type: Type.STRING }
          },
          required: ["topic", "context"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Scenario generation failed:", error);
    return { 
      topic: "在末日避难所，是否应该驱逐消耗资源的老人？", 
      context: "警报在狭窄的走廊回荡，氧气储量只剩 48 小时。你是避难所的决策者，面前是 50 个无法劳动的生命。" 
    };
  }
};

/**
 * 2. 获取辩手回复
 */
export const getDebaterResponse = async (
  topic: string,
  debater: Debater,
  mySide: Side,
  history: Message[],
  context?: string
): Promise<{ text: string, sources?: Source[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const mySideText = mySide === Side.PRO ? '正方' : '反方';
  
  const systemInstruction = `你现在是著名辩手 ${debater.name}。
  你的辩论风格是：${debater.style}。
  ${context ? `背景设定：${context}` : ''}
  当前辩题：${topic}。
  你的立场：${mySideText}。
  
  【指令】：
  1. 【沉浸感】：语气要有呼吸感。
  2. 【故事性】：引用生动事例，紧扣背景。
  3. 【金句】：每段发言末尾要有一句振聋发聩的金句。
  4. 【限制】：字数在 400 字以内，多用短句。`;

  let messagesPayload: any[] = history
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'ai' ? 'model' : 'user' as const,
      parts: [{ text: `${m.senderName}: ${m.content}` }]
    }));

  if (messagesPayload.length === 0) {
    messagesPayload = [{ role: 'user', parts: [{ text: `作为${mySideText}开始你的陈词。` }] }];
  } else {
    if (messagesPayload[0].role === 'model') {
      messagesPayload.unshift({ role: 'user', parts: [{ text: "开始辩论。" }] });
    }
    const simplified: any[] = [];
    messagesPayload.forEach(m => {
      if (simplified.length > 0 && simplified[simplified.length - 1].role === m.role) {
        simplified[simplified.length - 1].parts[0].text += `\n\n${m.parts[0].text}`;
      } else {
        simplified.push(m);
      }
    });
    if (simplified[simplified.length - 1].role === 'model') {
      simplified.push({ role: 'user', parts: [{ text: "请继续发言。" }] });
    }
    messagesPayload = simplified;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messagesPayload,
      config: {
        systemInstruction,
        temperature: 0.8,
        tools: [{ googleSearch: {} }]
      }
    });

    const candidate = response.candidates?.[0];
    let sources: Source[] = [];
    if (candidate?.groundingMetadata?.groundingChunks) {
      sources = candidate.groundingMetadata.groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
          uri: chunk.web!.uri,
          title: chunk.web!.title || '参考来源'
        }));
    }

    return { text: response.text || "我正在整理思绪...", sources };
  } catch (error) {
    console.error("Debater response failed:", error);
    return { text: "由于信号干扰，我暂时无法回应，请让我再思考一秒。" };
  }
};

/**
 * 3. 获取教练分析
 */
export const getCoachAnalysis = async (
  topic: string,
  userSide: Side,
  lastUserMsg: string,
  lastAiMsg: string
): Promise<CoachAnalysis | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const userSideText = userSide === Side.PRO ? '正方' : '反方';

  const prompt = `你现在是“思辨分析师”，请分析以下辩论。
  辩题：${topic}
  用户(${userSideText})：${lastUserMsg}
  对手：${lastAiMsg}
  请给出逻辑分析和建议，并评估当前观众支持率(0-100)。`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
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
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Coach analysis failed:", error);
    return null;
  }
};
