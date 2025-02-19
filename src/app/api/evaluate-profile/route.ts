// app/api/evaluate-profile/route.ts

import { NextResponse } from 'next/server';
import pdf2json from 'pdf2json';
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // in milliseconds

async function generateContent(prompt: string): Promise<string> {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        throw error;
    }
}

async function evaluateWithRetry(
    prompt: string,
    maxRetries = MAX_RETRIES,
    baseDelay = BASE_DELAY
): Promise<any> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const responseText = await generateContent(prompt);
            if (responseText && responseText.trim()) {
                let cleanedResponse = responseText.trim();

                // Enhanced Cleaning (Illustrative - Adapt as needed)
                cleanedResponse = cleanedResponse.replace(/```json/g, ''); // remove json markdown tags
                cleanedResponse = cleanedResponse.replace(/```/g, ''); // remove markdown tags
                cleanedResponse = cleanedResponse.replace(/\s+/g, ' '); // Remove multiple whitespaces
                cleanedResponse = cleanedResponse.replace(/\\/g, '\\\\'); // Escape backslashes
                cleanedResponse = cleanedResponse.replace(/\\"/g, '"');  // handle escaped quotes
                cleanedResponse = cleanedResponse.replace(/\n/g, '');   // Remove newlines
                cleanedResponse = cleanedResponse.replace(/`/g, '').replace(/\*/g, ''); // remove asterisks and backticks


                try {
                    return JSON.parse(cleanedResponse);
                } catch (jsonError) {
                    console.error('JSON parse error, attempting to extract partial data.', jsonError);

                    //  Basic Fallback: Attempt to extract values even if JSON is malformed
                    try {
                        //  This is a simplistic example - improve based on likely malformed structures
                        const summaryMatch = cleanedResponse.match(/"summary":\s*"([^"]*)"/i);
                        const verdictMatch = cleanedResponse.match(/"verdict":\s*"([^"]*)"/i);
                        const reasoningMatch = cleanedResponse.match(/"reasoning":\s*"([^"]*)"/i);

                        const extractedSummary = summaryMatch ? summaryMatch[1] : 'Partial data extraction failed';
                        const extractedVerdict = verdictMatch ? verdictMatch[1] : 'Error';
                        const extractedReasoning = reasoningMatch ? reasoningMatch[1] : 'No reasoning extracted';

                        return {
                            summary: extractedSummary,
                            verdict: extractedVerdict,
                            reasoning: extractedReasoning,
                            error: 'JSON parse failed, partial data extracted'
                        };
                    } catch (extractionError) {
                        console.error("Fallback extraction failed:", extractionError)
                        return {
                            summary: cleanedResponse,
                            verdict: 'Error',
                            error: 'Failed to parse JSON and extract partial data',
                            reasoning: 'Failed to parse JSON and extract partial data'
                        };
                    }
                }
            } else {
                console.error('Empty response, retrying...');
            }
        } catch (error) {
            console.error(`Error during generation (attempt ${attempt + 1}):`, error);
            await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
        }
    }
    throw new Error('Max retries reached');
}

function convertTextToJson(profileText: string): string {
    const jsonStructure = {
        profile: profileText
    };
    return JSON.stringify(jsonStructure);
}

function generateEvaluationPrompt(role: string, profileJson: string): string {
    return `
You are an expert evaluator. Analyze the following LinkedIn resume and provide:
1. A detailed summary of the key qualifications and experience
2. A clear verdict on whether the candidate is suitable for the ${role} role

Profile: ${profileJson}

Format your response STRICTLY as a VALID JSON object with the following structure.  Ensure there are no extra characters or text outside the JSON structure. Specify the data type.  Follow this template precisely.

\`\`\`json
{
  "summary": "Detailed summary of the profile (string)",
  "verdict": "Suitable" or "Not Suitable" (string)",
  "reasoning": "Detailed explanation for the verdict (string)"
}
\`\`\`

Ensure the response is valid JSON and contains all required fields.
`;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const role = (formData.get('role') as string) || 'judge';

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const pdfParser = new pdf2json();
        const profileText = await new Promise<string>((resolve, reject) => {
            let text = '';

            pdfParser.on('pdfParser_dataReady', (pdfData) => {
                try {
                    text = pdfData.Pages.reduce((acc: string, page: any) => {
                        return acc + page.Texts.map((text: any) =>
                            decodeURIComponent(text.R[0].T)
                        ).join(' ');
                    }, '');
                    resolve(text);
                } catch (error) {
                    reject(error);
                }
            });

            pdfParser.on('pdfParser_dataError', (error) => {
                reject(error);
            });

            pdfParser.parseBuffer(buffer);
        });

        if (!profileText || profileText.trim() === '') {
            return NextResponse.json({ error: 'No text extracted from PDF' }, { status: 400 });
        }

        const profileJson = convertTextToJson(profileText);
        const evaluationPrompt = generateEvaluationPrompt(role, profileJson);
        const evaluation = await evaluateWithRetry(evaluationPrompt);

        if (!evaluation || !evaluation.summary || !evaluation.verdict) {
            return NextResponse.json(
                {
                    error: 'Error processing request',
                    message: 'The evaluation data is incomplete or missing',
                    evaluation: {
                        summary: 'Error: Incomplete evaluation data',
                        verdict: 'Error',
                        reasoning: 'The evaluation response was incomplete or missing required fields'
                    }
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            evaluation: {
                summary: evaluation.summary,
                verdict: evaluation.verdict,
                reasoning: evaluation.reasoning || 'No reasoning provided'
            }
        });
    } catch (error: any) {
        console.error('Error evaluating profile:', error);
        return NextResponse.json(
            {
                error: 'Error processing request',
                message: error.message,
                evaluation: {
                    summary: 'Error occurred during evaluation',
                    verdict: 'Error',
                    reasoning: error.message
                }
            },
            { status: 500 }
        );
    }
}