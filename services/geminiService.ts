import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getGameCommentary = async (score: number): Promise<string> => {
  if (!apiKey) {
    return "API Key가 설정되지 않아 코딱지 분석을 할 수 없습니다! (하지만 훌륭한 실력이네요!)";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `The user just finished a game called "Booger Blaster" where they throw boogers at bugs. 
      Their score was ${score}.
      
      Please provide a short, humorous, and slightly gross commentary on their performance. 
      Include a random "Did you know?" fact about nasal mucus or insects.
      Keep it under 2 sentences. Respond in Korean.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "코딱지 분석 완료! 대단한 점수네요!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "통신 상태가 좋지 않아 코딱지 신호를 받을 수 없습니다.";
  }
};