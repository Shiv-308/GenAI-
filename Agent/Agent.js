import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const weatherApiKey = process.env.WEATHER_API_KEY;

// ---------------- WEATHER FUNCTION ----------------

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

  console.log("Weather function called!");

  return {
    location: data.name,
    temperature: data.main.temp,
    description: data.weather[0].description,
  };
};

// ---------------- CONVERSION FUNCTION ----------------

const convertCtoF = async (celsius) => {
  console.log("Conversion function called!");

  return celsius * 9 / 5 + 32;
};

// ---------------- GEMINI CLIENT ----------------

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ---------------- FUNCTION DECLARATIONS ----------------

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

const convertCtoFFunctionDeclaration = {
  name: "convert_celsius_to_fahrenheit",
  description: "Converts temperature from Celsius to Fahrenheit.",
  parameters: {
    type: "object",
    properties: {
      celsius: {
        type: "number",
        description: "Temperature in Celsius",
      },
    },
    required: ["celsius"],
  },
};

// ---------------- CONVERSATION ----------------

let content = [
  {
    role: "user",
    parts: [
      {
        text: "What's the weather in London? Give me the temperature in both Celsius and Fahrenheit. Use the weather function to get the Celsius temperature and the conversion function to convert it to Fahrenheit.",
      },
    ],
  },
];

// ---------------- FUNCTION CALLING LOOP ----------------

while (true) {
  const response = await client.models.generateContent({
    model: "gemini-3.8-flash",
    contents: content,
    config: {
      tools: [
        {
          functionDeclarations: [
            weatherFunctionDeclaration,
            convertCtoFFunctionDeclaration,
          ],
        },
      ],
    },
  });

  // Gemini wants to call a function
  if (response.functionCalls?.length > 0) {

    // Preserve Gemini's original function call
    content.push({
      role: "model",
      parts: response.candidates[0].content.parts,
    });

    // Execute every function Gemini requested
    for (const functionCall of response.functionCalls) {

      console.log("\nGemini called:", functionCall.name);
      console.log("Arguments:", functionCall.args);

      let result;

      // -------- WEATHER --------

      if (functionCall.name === "get_current_temperature") {

        result = await getWeather(
          functionCall.args.location
        );

      }

      // -------- CELSIUS → FAHRENHEIT --------

      else if (functionCall.name === "convert_celsius_to_fahrenheit") {

        result = await convertCtoF(
          functionCall.args.celsius
        );
      }

      // -------- SEND RESULT BACK TO GEMINI --------

      content.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: functionCall.name,
              response:
                result === null
                  ? {
                      error: "Unable to fetch weather data.",
                    }
                  : {
                      result: result,
                    },
            },
          },
        ],
      });
    }

  } else {

    // Gemini has finished using tools
    console.log("\nGemini:", response.text);

    break;
  }
}