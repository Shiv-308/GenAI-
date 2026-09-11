import { GoogleGenAI } from "@google/genai";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const ai = new GoogleGenAI({
    apiKey: "AQ.Ab8RN6Lh3hUUz5PYs9YnXyqiLLqLAZKWm7uAVlfwbMxSPKtCHg"
});

const rl = readline.createInterface({ input, output });

let history = [];

async function main(userMessage) {

    // Add user message to history
    history.push({
        type: "user_input",
        content: [
            {
                type: "text",
                text: userMessage
            }
        ]
    });

    const interaction = await ai.interactions.create({
        model: "gemini-3.8-flash",
        store: false,
        input: history
    });

    console.log("AI:", interaction.output_text);
}

while (true) {

    const userMessage = await rl.question("You: ");

    if (userMessage.toLowerCase() === "exit") {
        break;
    }

    await main(userMessage);
}

rl.close();