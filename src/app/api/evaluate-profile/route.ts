"use server";
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

        cleanedResponse = cleanedResponse.replace(/```json/g, '');
        cleanedResponse = cleanedResponse.replace(/```/g, '');
        cleanedResponse = cleanedResponse.replace(/\s+/g, ' ');
        cleanedResponse = cleanedResponse.replace(/\\/g, '\\\\');
        cleanedResponse = cleanedResponse.replace(/\\"/g, '"');
        cleanedResponse = cleanedResponse.replace(/\n/g, '');
        cleanedResponse = cleanedResponse.replace(/`/g, '').replace(/\*/g, '');

        try {
          return JSON.parse(cleanedResponse);
        } catch (jsonError) {
          console.error('JSON parse error, attempting to extract partial data.', jsonError);

          // If the JSON is still failing to be parsed, then try to extract data
          return {
            summary: `Failed to generate a complete response from profile text.`,
            verdict: "Not Suitable",
            reasoning: 'Failed to extract sufficient content from response for evaluation, could be malformed json',
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
  const cleanedProfileText = profileText.replace(/\\n/g, ' ');

  const jsonStructure = {
    profile: cleanedProfileText
  };
  return JSON.stringify(jsonStructure);
}

function generateEvaluationPrompt(profileText: string): string {
  const criteria = `
        - 3+ years professional experience
        - Strong skills in either Generative AI (NLP, LLM, etc.) or UI/UX
        - Leadership position (Team Lead, Manager, Technical Architect)
        - Experience in a well-established company
        - Domain expertise in the relevant field (Generative AI or UI/UX)
        - Contributions to industry events/publications
    `;
  return `
        Evaluate this profile for a Judge role based on these criteria:
        ${criteria}

        Profile: ${profileText}

        Based on the above criteria, provide a brief summary of the profile, then determine if the candidate is Suitable or Not Suitable for a Judge role, specifying if suitable for a Generative AI judge, a UI/UX judge, or neither. Return "Not Suitable" if it does not have a json structure.
        Return "Not Suitable" if you cannot ascertain if the profile meets the judge criteria.

        Please adhere to these guidelines strictly:
        - The summary should highlight the profile's relevant skills and experience, focusing on the criteria.
        - The verdict should directly state one of the following:
          - "Suitable for Generative AI Judge" if the profile primarily showcases AI/Generative AI skills and experience.
          - "Suitable for UI/UX Judge" if the profile primarily showcases UI/UX skills and experience.
          - "Not Suitable" if the profile lacks sufficient evidence of expertise in either Generative AI or UI/UX, as defined in the criteria.
        - If a candidate has experience in both UI/UX and AI, please pick the one that stands out more.
        - Do not include other fields other than what is asked
        - If for some reason you cannot assess them then state "Not Suitable"

        Format your response EXACTLY and ensure valid json as a JSON object with the following keys:
        {{"summary" : "string - summary of the profile.", "verdict" : "string - one of the pre-defined Verdict types mentioned above", "reasoning" : "Concise explanation for the verdict."}}
    `;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a new instance of pdf2json *within* the request scope
    const pdfParser = new pdf2json();
    let profileText = '';

    profileText = await new Promise<string>((resolve, reject) => {
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            try {
                const text = pdfData.Pages.reduce((acc: string, page: any) => {
                    return acc + page.Texts.map((text: any) => decodeURIComponent(text.R[0].T)).join(' ');
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
    const evaluationPrompt = generateEvaluationPrompt(profileJson);
    const evaluation = await evaluateWithRetry(evaluationPrompt);

    if (!evaluation || !evaluation.summary || !evaluation.verdict) {
        console.error("Evaluation failed, the model is unable to properly");
        return NextResponse.json(
                {
                    error: 'Error processing request',
                    message: 'The evaluation data is incomplete or missing',
                    evaluation: {
                        summary: "Unable to Evaluate",
                        verdict: "Not Suitable",
                        reasoning: "Unable to find evaluation result and therefore returning Not Suitable",
                    }
                },
                { status: 500 }
            );
    }
  

    return NextResponse.json({
      evaluation: {
        summary: evaluation.summary.replace(/\\n/g, ' '),
        verdict: evaluation.verdict.replace(/\\n/g, ' '),
        reasoning: evaluation.reasoning.replace(/\\n/g, ' ') || 'No reasoning provided'
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