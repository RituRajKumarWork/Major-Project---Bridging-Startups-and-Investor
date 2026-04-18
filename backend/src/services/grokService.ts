import OpenAI from 'openai';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const getOpenAIClient = (): OpenAI => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return new OpenAI({
    apiKey,
  });
};

export const callOpenAIAPI = async (
  messages: OpenAIMessage[],
  model: string = 'gpt-4o'
): Promise<string> => {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model,
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || 'No response from AI';
  } catch (error: any) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.error?.message || error.message;
    throw new Error(`OpenAI API error: ${errorMessage}`);
  }
};
