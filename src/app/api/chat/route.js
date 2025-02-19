import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TAQNEEQ_CYBER_INFO } from '../../../../lib/constants';
import { NextResponse } from 'next/server';

let model = null;

async function initialize() {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not defined in environment variables.");
        }
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        console.log("✅ Gemini AI initialized successfully.");
    } catch (error) {
        console.error("❌ Error initializing Gemini AI:", error);
        model = null;
    }
}

initialize();

const generationConfig = {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 1500,
};

const safetySettings = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
];

const chatHistories = {};
const MAX_HISTORY = 5;

function createPromptWithHistory(message, history, useTaqneeqInfo = false, taqneeq_info = "") {
    let prompt = "You are a helpful chatbot. Respond in plain text only, without any markdown formatting. Keep responses clear and conversational.\n";

    if (useTaqneeqInfo) {
        prompt += "You have the following information:\n";
        prompt += taqneeq_info + "\n";
        prompt += "Use this information if relevant to the user's query.\n";
    }

    if (history.length > 0) {
        prompt += "Here is the conversation history:\n";
        for (const turn of history) {
            prompt += `User: ${turn.user}\nChatbot: ${turn.bot}\n`;
        }
    }

    prompt += `User: ${message}\nChatbot:`;
    return prompt;
}

export async function POST(req) {
    if (!model) {
        console.error("❌ Model is not initialized.");
        return NextResponse.json({ error: "AI model is not available. Try again later." }, { status: 500 });
    }

    try {
        const { message, session_id = 'default' } = await req.json();

        if (!message || message.trim() === '') {
            return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
        }

        let chatHistory = chatHistories[session_id] || [];
        const useTaqneeqInfo = message.toLowerCase().includes("taqneeq") || message.toLowerCase().includes("cyber cypher");

        const prompt = createPromptWithHistory(message, chatHistory, useTaqneeqInfo, TAQNEEQ_CYBER_INFO);

        console.log("📝 Sending prompt:", prompt);

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
            safetySettings,
        });

        console.log("📩 Gemini API Response:", JSON.stringify(result, null, 2));

        let responseText = "Sorry, I couldn't generate a response.";

        if (result?.response?.candidates?.length > 0) {
            const firstCandidate = result.response.candidates[0];
            if (firstCandidate?.content?.parts?.length > 0) {
                // Remove any markdown formatting from the response
                responseText = firstCandidate.content.parts
                    .map(part => part.text.replace(/(\*\*|__|\*|_|`|#)/g, '').trim())
                    .join("\n");
            }
        }

        chatHistories[session_id] = [...chatHistory, { user: message, bot: responseText }];
        if (chatHistories[session_id].length > MAX_HISTORY) {
            chatHistories[session_id].shift();
        }

        return NextResponse.json({ response: responseText }, { status: 200 });
    } catch (error) {
        console.error("❌ Chat error:", error);
        return NextResponse.json({ error: "Sorry, there was an error processing your request." }, { status: 500 });
    }
}
