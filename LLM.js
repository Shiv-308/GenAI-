import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey : "AQ.Ab8RN6Lh3hUUz5PYs9YnXyqiLLqLAZKWm7uAVlfwbMxSPKtCHg"});

const interaction = await ai.interactions.create({
  model: "gemini-3.8-flash",
  input: "Who won IPL 2026?",
  // tools: [{ type: "google_search" }]
});

console.log(interaction.output_text);