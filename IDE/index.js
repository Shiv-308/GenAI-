import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import "dotenv/config";

const platform = os.platform();

const asyncExecute = promisify(exec);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


async function executeCommand({ command }) {
  try {
    console.log(`\nExecuting: ${command}`);

    const { stdout, stderr } = await asyncExecute(command);

    if (stderr) {
      return `Error: ${stderr}`;
    }

    return `Success: ${stdout || "Command executed successfully"}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}



const executeCommandTool = {
  type: "function",

  name: "executeCommand",

  description:
    "Execute a single terminal/shell command. " +
    "The command can create folders, create files, write files, " +
    "edit files, delete files, or perform other terminal operations.",

  parameters: {
    type: "object",

    properties: {
      command: {
        type: "string",

        description:
          'A single terminal command. Example: "mkdir calculator"',
      },
    },

    required: ["command"],
  },
};


const availableFunctions = {
  executeCommand,
};


// --------------------------------------------------
// AGENT
// --------------------------------------------------

async function runAgent(userProblem) {

  // Interactions API history
  const history = [
    {
      type: "user_input",

      content: [
        {
          type: "text",
          text: userProblem,
        },
      ],
    },
  ];


  while (true) {

    const response = await ai.interactions.create({

      model: "gemini-3.8-flash",

      store: false,

      input: history,

      tools: [
        executeCommandTool,
      ],

      system_instruction: `
You are a website builder expert.

Your job is to create the frontend of a website by analysing
the user's request.

You have access to a tool called executeCommand.

IMPORTANT:
Always use executeCommand to create and modify files.

Current operating system:
${platform}

Rules:
1. Analyse what type of website the user wants.
2. Build the website step by step.
3. ALWAYS use executeCommand for terminal/file operations.
4. Execute commands one by one.
5. Do not combine unrelated commands.
6. Continue working until the website is completely implemented.

Typical workflow:
1. Create project folder.
2. Create index.html.
3. Create style.css.
4. Create script.js.
5. Write HTML.
6. Write CSS.
7. Write JavaScript.
8. Finish the website.

Use commands appropriate for the operating system.
`,
    });


    history.push(...response.steps);


    // --------------------------------------------------
    // FIND FUNCTION CALL
    // --------------------------------------------------

    const functionCall = response.steps.find(
      (step) => step.type === "function_call"
    );


    // --------------------------------------------------
    // NO FUNCTION CALL = FINAL ANSWER
    // --------------------------------------------------

    if (!functionCall) {

      console.log("\nAgent:");

      console.log(response.output_text || "Task completed.");

      break;
    }


    console.log("\nFunction Call:");

    console.log(functionCall);


    const functionName = functionCall.name;

    const functionArgs = functionCall.arguments;


    const toolFunction = availableFunctions[functionName];

    if (!toolFunction) {

      console.log(`Unknown function: ${functionName}`);

      break;
    }

    const result = await toolFunction(functionArgs);


    console.log("\nTool Result:");

    console.log(result);


    history.push({

      type: "function_result",

      name: functionName,

      call_id: functionCall.id,

      result: [
        {
          type: "text",

          text: result,
        },
      ],
    });


    // Continue agent loop
  }
}


// --------------------------------------------------
// MAIN
// --------------------------------------------------

async function main() {

  console.log("\nI am a Cursor-like website builder.");

  while (true) {

    const userProblem = readlineSync.question(
      "\nAsk me anything --> "
    );

    if (!userProblem.trim()) {
      continue;
    }

    await runAgent(userProblem);
  }
}


main();
