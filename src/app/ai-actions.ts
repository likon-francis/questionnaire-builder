'use server';

import { Question, QuestionType } from '@/types/schema';

// Securely access the key from server environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function generateAIQuestions(
    topic: string,
    amount: number,
    additionalDetails?: string
): Promise<Question[]> {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API Key is not configured');
    }

    const systemPrompt = `
You are an expert questionnaire designer.
Generate ${amount} questions for a survey about "${topic}".
${additionalDetails ? `Additional Context: ${additionalDetails}` : ''}

Output strictly valid JSON.
The output must be an ARRAY of Question objects.
Each Question object must have:
- title: string (The question text)
- type: One of "text", "number", "date", "single-select", "multi-select", "boolean"
- description: string (Optional, brief context)
- options: Array of { label: string, value: string } (REQUIRED for single-select/multi-select, omit otherwise)
- required: boolean (default true)

Do not include "id" field, I will generate it.
Do not cover the answer, just the question structure.
Ensure the JSON is raw, no markdown formatting (like \`\`\`json).
`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                // OpenRouter specific headers
                'HTTP-Referer': 'https://insightflow.app', // Optional for rankings
                'X-Title': 'InsightFlow AI',
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.3-70b-instruct', // A good, fast model usually available
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate ${amount} questions about ${topic}` }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' } // Enforce JSON if supported, or rely on prompt
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenRouter Error:', errText);
            throw new Error(`AI Generation Failed: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) throw new Error('No content received from AI');

        // Parse JSON - Clean potential markdown
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const questionsRaw = JSON.parse(cleaned);

        // Handle if API returns { questions: [...] } wrapper or just [...]
        const questionsArray = Array.isArray(questionsRaw) ? questionsRaw : (questionsRaw.questions || []);

        return questionsArray.map((q: any) => ({
            id: Math.random().toString(36).substr(2, 9), // Temporary ID
            title: q.title || 'Untitled Question',
            description: q.description || '',
            type: validateType(q.type),
            required: q.required ?? true,
            options: q.options || undefined
        }));

    } catch (error) {
        console.error('AI Generation Error:', error);
        throw error;
    }
}

function validateType(type: string): QuestionType {
    const valid: QuestionType[] = ['text', 'number', 'date', 'single-select', 'multi-select', 'boolean'];
    if (valid.includes(type as any)) return type as QuestionType;
    return 'text'; // Fallback
}
