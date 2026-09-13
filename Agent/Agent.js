import { GoogleGenAI } from '@google/genai';
import "dotenv/config";

const weatherApiKey = process.env.WEATHER_API_KEY;

const getWeather = async (location) => {

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${weatherApiKey}&units=metric`
  );

  console.log("Status:", response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log("Weather API error:", error);
    return null;
  }

  const data = await response.json();

  console.log("Function called!");
  console.log("Weather data:", data);

  return data;
};


const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


const weatherFunctionDeclaration = {
  name: "get_current_temperature",
  description: "Gets the current weather for a given location.",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The city name, e.g. London",
      },
    },
    required: ["location"],
  },
};


let content = [
  {
    role: "user",
    parts: [
      {
        text: "What's the weather in London?"
      }
    ]
  }
];


while (true) {

  const response = await client.models.generateContent({
    model: "gemini-3.8-flash",
    contents: content,
    config: {
      tools: [
        {
          functionDeclarations: [weatherFunctionDeclaration]
        }
      ]
    }
  });


  // Gemini wants to call our function
  if (response.functionCalls?.length > 0) {

    const functionCall = response.functionCalls[0];

    console.log("Gemini called:", functionCall.name);
    console.log("Location:", functionCall.args.location);


    // Execute our actual JavaScript function
    const result = await getWeather(
      functionCall.args.location
    );


    // Preserve Gemini's ORIGINAL function call
    // This keeps the thought signature
    content.push({
      role: "model",
      parts: response.candidates[0].content.parts
    });


    // Send function result back to Gemini
    content.push({
      role: "user",
      parts: [
        {
          functionResponse: {
            name: functionCall.name,
            response: result === null
              ? {
                  error: "Unable to fetch weather data."
                }
              : result
          }
        }
      ]
    });


  } else {

    console.log("Gemini:", response.text);

    break;
  }
}