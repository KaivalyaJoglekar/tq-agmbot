export function generateEvaluationPrompt(role, profileText) {
    if (role === "judge") {
        return `
            Evaluate this profile for a Judge role based on these criteria:
            - 3+ years professional experience
            - Strong skills in either Generative AI (NLP, LLM, etc.) or UI/UX
            - Leadership position (Team Lead, Manager, Technical Architect)
            - Experience in a well-established company
            - Domain expertise in the relevant field (Generative AI or UI/UX)
            - Contributions to industry events/publications.

            Profile: ${profileText}

            Based on the above criteria, provide a brief summary of the profile, then conclude if the candidate is Suitable or Not Suitable for a Judge role, specifying if suitable for a Generative AI judge or UI/UX judge, or Not Suitable.
            Format your response as a JSON object with the following keys:
            "summary" : a string representing the summary of the profile.
            "verdict" : a string indicating if suitable for a Generative AI judge or a UI/UX judge, or Not Suitable
        `;
    } else if (role === "speaker") {
        return `
            Evaluate this profile for a Speaker role based on these criteria:
            - Strictly requires a senior leadership role (CEO, CTO, VP)
            - High level of professional experience from a reputed company
            - Strong public speaking and engagement skills
            - Thought leadership in either Generative AI or UI/UX
            - Industry recognition in the relevant domain
            - Experience in speaking engagements/publications.

            Profile: ${profileText}

            Based on the above criteria, provide a brief summary of the profile, then conclude if the candidate is Suitable or Not Suitable for a Speaker role, or Not Suitable.
            Format your response as a JSON object with the following keys:
            "summary" : a string representing the summary of the profile.
            "verdict" : a string indicating if suitable for a Speaker role, or Not Suitable.
        `;
    } else {
        throw new HTTPException(400, "Invalid role provided");
    }
}
export function createPromptWithHistory(message, history, useTaqneeqInfo = false, taqneeq_info) {
    let prompt = "You are a helpful chatbot. Respond in a conversational manner.\n";

    if (useTaqneeqInfo) {
        prompt += "You have the following information:\n";
        prompt += taqneeq_info + "\n";
        prompt += "Use this information if it is relevant to the user's query.\n";
    }

    if (history) {
        prompt += "Here is the conversation history:\n";
        for (const turn of history) {
            prompt += `User: ${turn.user}\nChatbot: ${turn.bot}\n`;
        }
    }

    prompt += `User: ${message}\nChatbot:`;
    return prompt;
}