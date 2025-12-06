import { GoogleGenAI } from "@google/genai";
import { DailyBalance } from "../types";

const API_KEY = process.env.API_KEY || '';

export const analyzeCashFlow = async (
  forecast: DailyBalance[], 
  scenario: string
): Promise<string> => {
  if (!API_KEY) {
    return "API Key ontbreekt. Configureer de API key om AI-analyse te gebruiken.";
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Prepare a concise summary for the model
  const dataSummary = forecast.map(d => 
    `${d.date}: Saldo €${d.balance.toFixed(0)} (In: €${d.incoming.toFixed(0)}, Uit: €${d.outgoing.toFixed(0)})`
  ).join('\n');

  const prompt = `
    Je bent een zakelijke financiële assistent. Analyseer de volgende cashflow voorspelling voor de komende 7 dagen.
    Scenario: ${scenario}.
    
    Data:
    ${dataSummary}
    
    Geef beknopt advies (maximaal 2 zinnen van 15 woorden per zin). Wees feitelijk en direct. Focus op liquiditeitsrisico's of kansen.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Geen analyse beschikbaar.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Er is een fout opgetreden bij het ophalen van de analyse.";
  }
};