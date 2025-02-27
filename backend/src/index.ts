require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
import express from "express"; // No need for { response }
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import cors from "cors"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const app = express();
app.use(express.json());
app.use(cors());

app.post("/template", async (req, res) => {
  const prompt = req.body.prompt; // Or req.body.prompt if you want to use the user's prompt
  console.log(prompt);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "Return either 'node' or 'react' based on what you think this project should be. Only return a single word: 'node' or 'react'. Do not return anything extra.",
  });
  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 200,
      temperature: 0,
    },
  });
  const answer = response.response.candidates[0].content.parts[0].text.trim();
  console.log("Extracted Part:", answer);

  if (answer === "react") {
    res.json({
      prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
      uiPrompts: [reactBasePrompt]
    })
    return;
  }
  if (answer === "node") {
    res.json({
      prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\n \n`],
      uiPrompts: [nodeBasePrompt]
    })
    return;
  }
  console.log("Invalid answer from Gemini:", answer); // Handle invalid responses
  res.status(500).send("Invalid response from the AI model.");

});

app.post("/chat", async (req, res) => {
  const messages = req.body.contents;
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: getSystemPrompt(),
  });

  try {
    const response = await model.generateContent({
      contents: messages,
      generationConfig: {
        maxOutputTokens: 10000,
        temperature: 0,
      },
    });

    // Set headers for Server-Sent Events (SSE)
    // res.writeHead(200, {
    //   "Content-Type": "text/event-stream",
    //   "Cache-Control": "no-cache",
    //   "Connection": "keep-alive",
    // });

    // for await (const chunk of response.stream) {  // Correct place to access the stream
    //   if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content && chunk.candidates[0].content.parts) {
    //     for (const part of chunk.candidates[0].content.parts) {
    //       if (part.text) {
    //         const chunkText = part.text;
    //         process.stdout.write(`${chunkText}`); // Send data in SSE format
    //       }
    //     }
    //   }
    // }

    // res.end(); // Signal the end of the stream

    // const result = await model.generateContent(messages);

    res.json({
      response: (response.response.candidates[0].content.parts[0].text)
    });
    // console.log(response.response.candidates[0].content.parts[0].text);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Error calling the AI model." }); // Send JSON error response
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});