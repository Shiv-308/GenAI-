import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
const ai = new GoogleGenAI({ apiKey : process.env.GEMINI_API_KEY});

const interaction = await ai.interactions.create({
  model: "gemini-3.8-flash",
  input: "Who won IPL 2026?",
  // tools: [{ type: "google_search" }]
});

console.log(interaction.output_text);