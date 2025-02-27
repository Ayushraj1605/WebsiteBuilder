"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express_1 = __importDefault(require("express")); // No need for { response }
const node_1 = require("./defaults/node");
const react_1 = require("./defaults/react");
const prompts_1 = require("./prompts");
const cors_1 = __importDefault(require("cors"));
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post("/template", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = req.body.prompt; // Or req.body.prompt if you want to use the user's prompt
    console.log(prompt);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: "Return either 'node' or 'react' based on what you think this project should be. Only return a single word: 'node' or 'react'. Do not return anything extra.",
    });
    const response = yield model.generateContent({
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
            prompts: [prompts_1.BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [react_1.basePrompt]
        });
        return;
    }
    if (answer === "node") {
        res.json({
            prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\n \n`],
            uiPrompts: [node_1.basePrompt]
        });
        return;
    }
    console.log("Invalid answer from Gemini:", answer); // Handle invalid responses
    res.status(500).send("Invalid response from the AI model.");
}));
app.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = req.body.contents;
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: (0, prompts_1.getSystemPrompt)(),
    });
    try {
        const response = yield model.generateContent({
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
    }
    catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: "Error calling the AI model." }); // Send JSON error response
    }
}));
app.listen(3000, () => {
    console.log("Server listening on port 3000");
});
