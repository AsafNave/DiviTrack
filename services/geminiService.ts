import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { DividendEvent, GroundingSource } from "../types";

// Initialize lazily or check for key
export const fetchDividendData = async (tickers: string[]): Promise<{ events: DividendEvent[], sources: GroundingSource[] }> => {
  // Use Vite's standard env var access
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key is missing!");
    throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY in .env.local");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  if (tickers.length === 0) {
    return { events: [], sources: [] };
  }

  const prompt = `
    I need the most recent and next upcoming dividend information for the following stock tickers: ${tickers.join(', ')}.
    
    Search for the latest declared dividends or reliable next estimates. 
    For non - US stocks(e.g., .TA), check specific financial portals.
    
    Return a JSON array where each object has:
- symbol
  - exDate(YYYY - MM - DD)
  - payDate(YYYY - MM - DD)
  - amount(number)
  - currency
  - status("Confirmed" or "Estimated")

    If no upcoming dividend is found, omit the ticker.
    Dates must be future or recent past(30 days).
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    const response = await result.response;
    const text = response.text();

    let events: DividendEvent[] = [];
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      events = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Failed to parse dividend data.");
    }

    // Grounding metadata is different in this SDK version or requires specific access
    // For now returning empty sources as we prioritize data fetching
    const sources: GroundingSource[] = [];

    return { events, sources };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
