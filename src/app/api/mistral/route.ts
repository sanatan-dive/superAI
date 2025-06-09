// app/api/Features/Summary/route.ts (App Router)

import { NextRequest, NextResponse } from 'next/server';

interface AIResponse {
  model: string;
  result?: string;
  response?: string;
  summary?: string;
  text?: string;
}

interface SummaryRequest {
  message: string;
  responses: AIResponse[];
  userContext?: {
    userId: string;
    courseName?: string;
    currentLesson?: string;
    learningGoals?: string[];
  };
}

// OpenRouter API configuration  
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'SuperAI';

class SummaryService {
  private buildSystemPrompt(userContext?: any): string {
    return `You are an expert AI synthesis assistant. Your single task is to create the most accurate, comprehensive, and actionable final answer by combining multiple AI responses.

CRITICAL INSTRUCTIONS:
1. Synthesize all responses into ONE definitive answer
2. Extract the best information from each response
3. Resolve contradictions by choosing the most accurate information
4. Present the final answer as if it came from a single, highly knowledgeable source
5. Use clear, professional markdown formatting
6. Be concise but complete - no redundancy or fluff

OUTPUT FORMAT:
- Start directly with the synthesized answer
- Use ## for main sections only when necessary
- Use **bold** for key points
- Use bullet points for lists
- Include code blocks with \`\`\` for technical content
- End with actionable recommendations if applicable

AVOID:
- Mentioning "multiple responses" or "different AI models"
- Phrases like "According to Response 1" or "AI X suggests"
- Redundant information
- Contradictory statements
- Meta-commentary about the synthesis process

Your goal: Provide the user with the single best answer to their question, as if you were the most knowledgeable expert on the topic.`;
  }

  private cleanResponse(text: string): string {
    if (!text) return "";
    
    // Remove reasoning blocks
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');
    cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '');
    
    // Remove meta-commentary about synthesis
    cleaned = cleaned.replace(/based on the.*?responses?:?\s*/gi, '');
    cleaned = cleaned.replace(/after analyzing.*?responses?:?\s*/gi, '');
    cleaned = cleaned.replace(/combining.*?information:?\s*/gi, '');
    cleaned = cleaned.replace(/synthesizing.*?responses?:?\s*/gi, '');
    
    // Remove reference to multiple sources
    cleaned = cleaned.replace(/according to (response|ai|model)\s*\d+:?\s*/gi, '');
    cleaned = cleaned.replace(/response \d+ (suggests|states|mentions):?\s*/gi, '');
    cleaned = cleaned.replace(/(ai|model) [a-z] (suggests|states|mentions):?\s*/gi, '');
    
    // Clean up formatting
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Remove common summary prefixes
    cleaned = cleaned.replace(/^(summary|here's|based on):?\s*/i, '');
    cleaned = cleaned.replace(/^(comprehensive|final) (answer|summary):?\s*/i, '');
    
    return cleaned;
  }

  private buildSummaryPrompt(message: string, responses: AIResponse[]): string {
    let prompt = `Question: "${message}"\n\n`;
    prompt += `Multiple AI responses to synthesize:\n\n`;

    responses.forEach((resp, index) => {
      const responseText = resp.result || resp.response || resp.summary || resp.text || '';
      if (responseText) {
        prompt += `Response ${index + 1}:\n${responseText}\n\n`;
      }
    });

    prompt += `\nTask: Create the single best, most comprehensive answer by combining the valuable information from all responses above. Present it as one unified, authoritative response without referencing the individual sources.`;

    return prompt;
  }

  private async callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-0528:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3, // Lower temperature for more focused synthesis
          max_tokens: 2000,
          top_p: 0.8,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error('Unexpected response format from OpenRouter');
      }
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw error;
    }
  }

  async generateSummary(request: SummaryRequest): Promise<any> {
    try {
      const systemPrompt = this.buildSystemPrompt(request.userContext);
      const userPrompt = this.buildSummaryPrompt(request.message, request.responses);

      const response = await this.callOpenRouter(systemPrompt, userPrompt);
      const cleanedResponse = this.cleanResponse(response);

      if (!cleanedResponse || cleanedResponse.length < 20) {
        return {
          success: false,
          result: "I couldn't generate a comprehensive summary. Please try again with your request.",
          originalMessage: request.message,
          responseCount: request.responses.length,
          processedAt: new Date().toISOString(),
          model_used: 'deepseek/deepseek-r1-0528:free'
        };
      }

      return {
        success: true,
        result: cleanedResponse,
        summary: cleanedResponse,
        originalMessage: request.message,
        responseCount: request.responses.length,
        processedAt: new Date().toISOString(),
        model_used: 'deepseek/deepseek-r1-0528:free'
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('401')) {
          return {
            success: false,
            error: "API configuration error",
            result: "I'm having technical difficulties with the API configuration. Please try again later.",
            originalMessage: request.message,
            responseCount: request.responses.length,
            processedAt: new Date().toISOString()
          };
        }
        
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          return {
            success: false,
            error: "Rate limit exceeded",
            result: "I'm currently experiencing high demand. Please try again in a few moments.",
            originalMessage: request.message,
            responseCount: request.responses.length,
            processedAt: new Date().toISOString()
          };
        }
      }
      
      return {
        success: false,
        error: 'Failed to generate summary',
        result: "I'm experiencing technical issues. Please try again shortly.",
        originalMessage: request.message,
        responseCount: request.responses.length,
        processedAt: new Date().toISOString()
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { message, responses } = body;
    if (!message || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: message and responses array',
          success: false
        },
        { status: 400 }
      );
    }

    const summaryService = new SummaryService();
    const result = await summaryService.generateSummary(body as SummaryRequest);
    
    const status = result.success ? 200 : 500;
    return NextResponse.json(result, { status });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false,
        result: "I'm having technical difficulties. Please try again in a moment.",
        processedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Summary API is running',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}