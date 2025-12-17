import { GoogleGenAI } from "@google/genai";
import { DividendEvent, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchDividendData = async (tickers: string[]): Promise<{ events: DividendEvent[], sources: GroundingSource[] }> => {
  if (tickers.length === 0) {
    return { events: [], sources: [] };
  }

  const prompt = `
    I need the most recent and next upcoming dividend information for the following stock tickers: ${tickers.join(', ')}.
    
    Please search for the latest declared dividends or reliable next estimates. 
    For non-US stocks (e.g. those ending in .TA), ensure you look for data from specific financial portals (like investing.com, TASE, or similar) to get accurate local ex-dates and payment dates.
    
    Return the data strictly as a JSON array of objects inside a markdown code block (\`\`\`json ... \`\`\`).
    Each object should have these fields:
    - symbol: string (The ticker)
    - exDate: string (YYYY-MM-DD format, date stock trades without dividend)
    - payDate: string (YYYY-MM-DD format, date dividend is paid)
    - amount: number (The dividend amount per share)
    - currency: string (e.g., USD, ILS)
    - status: string ("Confirmed" or "Estimated")

    If no upcoming dividend is found for a specific ticker (e.g. it doesn't pay dividends), omit it from the list.
    Ensure dates are in the future or very recent past (last 30 days) if the next one isn't declared yet.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType cannot be JSON when using search, so we parse manually
        temperature: 0.1, // Low temperature for factual data
      },
    });

    const text = response.text;
    
    // Extract JSON from markdown code block
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    let events: DividendEvent[] = [];
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        events = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Failed to parse JSON from Gemini response", e);
        throw new Error("Failed to parse dividend data.");
      }
    } else {
        // Fallback: try to parse raw text if no code blocks
        try {
            events = JSON.parse(text);
        } catch(e) {
            console.warn("Could not parse raw text as JSON either.");
        }
    }

    // Extract grounding metadata sources
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    return { events, sources };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
