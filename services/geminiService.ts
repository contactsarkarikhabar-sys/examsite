import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to get the AI instance with the latest key
const getAI = () => {
  // Always fetch the key from process.env at the moment of the call
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenerativeAI(apiKey);
};

export const generateJobAdvice = async (userPrompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "नमस्ते! मैं ExamSite AI हूँ। आप मुझसे नौकरियों, पात्रता, और परीक्षा पैटर्न के बारे में पूछ सकते हैं। कृपया अपना सवाल पूछें!";
  }

  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
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
            `
    });

    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    return response.text() || "Sorry, I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I am having trouble connecting to the server. Please try again later.";
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  // TTS is not directly supported in the standard text generation models of @google/generative-ai
  // Returning null for now to avoid build errors. 
  // If TTS is critical, we would need to use the REST API directly or a different library.
  console.warn("TTS temporarily disabled during migration to @google/generative-ai");
  return null;
};
