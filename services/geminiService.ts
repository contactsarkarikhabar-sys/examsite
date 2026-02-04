import { GoogleGenAI } from "@google/genai";
import { Modality } from "@google/genai";

// Helper to get the AI instance with the latest key
const getAI = () => {
  // Always fetch the key from process.env at the moment of the call
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export const generateJobAdvice = async (userPrompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "Please select a Google API Key to use the AI features.";
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: `You are ExamSite AI, a helpful and knowledgeable assistant for the ExamSite.in portal. 
        Your goal is to assist Indian job seekers in finding government jobs, understanding syllabi, and knowing important dates.
        
        Guidelines:
        1. Be concise and point-wise.
        2. If asked about "Latest Jobs", mention popular ongoing exams like SSC, UPSC, Railway, Banking.
        3. Explain eligibility criteria clearly (e.g., Age limit, Qualification).
        4. Tone: Encouraging, professional, and informative.
        5. Use simple English or Hinglish if the user prefers.
        
        Mock Current Context (Use this if specific data is needed but not provided by user):
        - SSC CGL 2025 is active.
        - UP Police Constable vacancy is popular.
        - Railway NTPC is upcoming.
        `,
      }
    });
    
    return response.text || "Sorry, I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I am having trouble connecting to the server. Please try again later.";
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  
  try {
    const ai = getAI();
    // We use gemini-2.5-flash-preview-tts for speech generation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    
    // Extract base64 audio data
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};
