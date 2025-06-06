import { NextRequest } from 'next/server';

// Function to clean and format the summary response
function cleanAndFormatSummary(text: string, originalPrompt: string): string {
  if (!text) return "";
  
  let cleaned = text.trim();
  
  // Remove the original prompt if it's included in the response
  if (cleaned.includes(originalPrompt)) {
    cleaned = cleaned.replace(originalPrompt, '').trim();
  }
  
  // Remove common prompt artifacts
  cleaned = cleaned.replace(/^Summary:\s*/i, '');
  cleaned = cleaned.replace(/^Here's a comprehensive summary:\s*/i, '');
  cleaned = cleaned.replace(/^Based on the above responses:\s*/i, '');
  
  // Ensure proper markdown formatting
  // Fix headers
  cleaned = cleaned.replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2');
  
  // Ensure proper spacing around sections
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  
  // Fix bullet points
  cleaned = cleaned.replace(/^\s*[\-\*\+]\s+/gm, '- ');
  
  // Fix numbered lists
  cleaned = cleaned.replace(/^\s*(\d+)\.\s+/gm, '$1. ');
  
  // Ensure proper spacing around code blocks
  cleaned = cleaned.replace(/```(\w+)?\n/g, '```$1\n');
  cleaned = cleaned.replace(/\n```/g, '\n```');
  
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, responses } = body;

    // Validate input
    if (!message || !responses || !Array.isArray(responses)) {
      return Response.json(
        { error: 'Missing required fields: message and responses array' },
        { status: 400 }
      );
    }

    // Check if API key exists
    const apiKey = process.env.HF_TOKEN;
    if (!apiKey) {
      console.error('HUGGINGFACE_API_KEY environment variable is not set');
      return Response.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Create a comprehensive prompt for summarization with markdown formatting instructions
    let combinedInput = `Original Question: "${message}"\n\n`;
    combinedInput += `AI Responses to Summarize:\n\n`;

    // Add each AI response to the input - FIXED: Check multiple possible response fields
    responses.forEach((resp: any, index: number) => {
      combinedInput += `${index + 1}. ${resp.model.toUpperCase()} Response:\n`;
      
      // Try different possible response field names
      const responseText = resp.result || resp.response || resp.summary || resp.text || '';
      
      if (!responseText) {
        console.warn(`Warning: No response content found for ${resp.model}. Available fields:`, Object.keys(resp));
        combinedInput += `[No response content available]\n\n`;
      } else {
        combinedInput += `${responseText}\n\n`;
      }
    });

    // Enhanced summarization instruction with markdown formatting
    combinedInput += `Please provide a comprehensive summary in well-structured markdown format. Use proper markdown syntax including:\n`;
    combinedInput += `- Headers (# ## ###) to organize different sections\n`;
    combinedInput += `- **Bold** text for key points and emphasis\n`;
    combinedInput += `- Bullet points for lists and comparisons\n`;
    combinedInput += `- Code blocks with \`\`\` when discussing technical concepts\n`;
    combinedInput += `- Proper paragraph spacing for readability\n\n`;
    combinedInput += `Structure your summary to cover:\n`;
    combinedInput += `## Key Insights\n`;
    combinedInput += `- Common themes and agreements between the responses\n`;
    combinedInput += `- Unique insights from each AI model\n\n`;
    combinedInput += `## Synthesized Answer\n`;
    combinedInput += `- A comprehensive answer incorporating the best elements from all responses\n\n`;
    combinedInput += `## Different Perspectives\n`;
    combinedInput += `- Any contradictions or varying viewpoints that should be noted\n\n`;
    combinedInput += `## Conclusion\n`;
    combinedInput += `- Final recommendations or takeaways\n\n`;
    combinedInput += `Summary:`;

    console.log('Sending to Hugging Face API:', combinedInput.substring(0, 500) + '...');

    // Debug: Log the responses structure
    console.log('Debug - Response objects:', responses.map(r => ({
      model: r.model,
      hasResult: !!r.result,
      hasResponse: !!r.response,
      hasSummary: !!r.summary,
      keys: Object.keys(r)
    })));

    // Try direct API call to Hugging Face with enhanced parameters
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: combinedInput,
          parameters: {
            max_new_tokens: 1500, // Increased for more comprehensive summaries
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            repetition_penalty: 1.1, // Prevent repetitive text
            stop: ["\n\n\n\n"], // Stop at excessive newlines
          },
          options: {
            wait_for_model: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API Error:', response.status, errorText);

      // Handle specific error cases
      if (response.status === 401) {
        return Response.json(
          { error: 'Invalid API credentials. Please check your Hugging Face API key.' },
          { status: 401 }
        );
      }

      if (response.status === 429) {
        return Response.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      if (response.status === 503) {
        return Response.json(
          { error: 'Model is currently loading. Please try again in a few moments.' },
          { status: 503 }
        );
      }

      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    // console.log('Hugging Face response:', result);

    // Handle different response formats
    let rawSummary = '';
    if (Array.isArray(result) && result.length > 0) {
      rawSummary = result[0].generated_text || result[0].text || '';
    } else if (result.generated_text) {
      rawSummary = result.generated_text;
    } else if (typeof result === 'string') {
      rawSummary = result;
    } else {
      console.error('Unexpected response format:', result);
      rawSummary = 'Unable to generate summary due to unexpected response format.';
    }

    // Clean and format the summary
    const cleanedSummary = cleanAndFormatSummary(rawSummary, combinedInput);

    // console.log('Raw Summary:', rawSummary.substring(0, 300) + '...');
    // console.log('Cleaned Summary:', cleanedSummary.substring(0, 300) + '...');

    return Response.json({
      success: true,
      result: cleanedSummary, // Changed from 'summary' to 'result' for consistency
      summary: cleanedSummary, // Keep both for backward compatibility
      originalMessage: message,
      responseCount: responses.length,
      processedAt: new Date().toISOString(),
      model_used: 'mistralai/Mixtral-8x7B-Instruct-v0.1'
    });

  } catch (error: unknown) {
    console.error('Mistral API Error:', error);

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return Response.json(
        { error: 'Network error. Please check your internet connection.' },
        { status: 503 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return Response.json(
      { error: 'Failed to generate summary', details: errorMessage },
      { status: 500 }
    );
  }
}