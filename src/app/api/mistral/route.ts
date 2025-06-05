import { NextRequest } from 'next/server';

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

    // Create a comprehensive prompt for summarization
    let combinedInput = `Original Question: "${message}"\n\n`;
    combinedInput += `AI Responses to Summarize:\n\n`;

    // Add each AI response to the input
    responses.forEach((resp, index) => {
      combinedInput += `${index + 1}. ${resp.model.toUpperCase()} Response:\n`;
      combinedInput += `${resp.response}\n\n`;
    });

    // Add summarization instruction
    combinedInput += `Please provide a comprehensive summary that combines the key insights from all the above AI responses. Focus on:\n`;
    combinedInput += `- Common themes and agreements between the responses\n`;
    combinedInput += `- Unique insights from each AI model\n`;
    combinedInput += `- A synthesized answer that incorporates the best elements from all responses\n`;
    combinedInput += `- Any contradictions or different perspectives that should be noted\n\n`;
    combinedInput += `Summary:`;

    console.log('Sending to Hugging Face API:', combinedInput.substring(0, 500) + '...');

    // Try direct API call to Hugging Face
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
            max_new_tokens: 1000,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
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
    console.log('Hugging Face response:', result);

    // Handle different response formats
    let summary = '';
    if (Array.isArray(result) && result.length > 0) {
      summary = result[0].generated_text || result[0].text || '';
    } else if (result.generated_text) {
      summary = result.generated_text;
    } else if (typeof result === 'string') {
      summary = result;
    } else {
      console.error('Unexpected response format:', result);
      summary = 'Unable to generate summary due to unexpected response format.';
    }

    // Clean up the summary (remove the original prompt if it's included)
    if (summary.includes(combinedInput)) {
      summary = summary.replace(combinedInput, '').trim();
    }

    return Response.json({
      success: true,
      summary: summary,
      originalMessage: message,
      responseCount: responses.length,
      processedAt: new Date().toISOString(),
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