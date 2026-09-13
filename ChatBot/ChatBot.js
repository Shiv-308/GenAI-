import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {
  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: "What is the time complexity of binary search?",
    system_instruction: `You are a DSA Trainer. Answer DSA/coding questions clearly and concisely in exactly one line. 
    Stay strictly within the DSA/coding context;
    for unrelated queries, politely state that you only handle DSA and coding topics.`,
  });
  console.log(interaction.output_text);
}

await main();