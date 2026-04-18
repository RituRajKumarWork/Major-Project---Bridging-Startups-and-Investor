import { FounderProfile } from '../types';
import { CSVData } from '../types';
import { callOpenAIAPI, OpenAIMessage } from './grokService';

export const buildRAGContext = (
  profile: FounderProfile | null,
  csvData: CSVData[]
): string => {
  let context = '';

  if (profile) {
    context += `Founder Profile:\n`;
    context += `- Company: ${profile.company_name}\n`;
    context += `- Domain: ${profile.domain}\n`;
    context += `- Funding Stage: ${profile.funding_stage}\n`;
    context += `- Valuation: $${profile.valuation.toLocaleString()}\n`;
    if (profile.description) {
      context += `- Description: ${profile.description}\n`;
    }
    if (Object.keys(profile.social_links || {}).length > 0) {
      context += `- Social Links: ${JSON.stringify(profile.social_links)}\n`;
    }
    context += '\n';
  }

  if (csvData.length > 0) {
    context += `Financial Data (Last ${Math.min(csvData.length, 12)} months):\n`;
    const recentData = csvData.slice(-12);
    recentData.forEach(data => {
      context += `- ${data.month.toISOString().split('T')[0]}: Revenue=$${data.revenue.toLocaleString()}, Expenses=$${data.expenses.toLocaleString()}, Profit=$${data.profit.toLocaleString()}\n`;
    });

    // Calculate trends
    if (recentData.length >= 2) {
      const first = recentData[0];
      const last = recentData[recentData.length - 1];
      const revenueGrowth = ((last.revenue - first.revenue) / first.revenue) * 100;
      const expenseGrowth = ((last.expenses - first.expenses) / first.expenses) * 100;
      const profitGrowth = ((last.profit - first.profit) / Math.abs(first.profit)) * 100;

      context += `\nTrends:\n`;
      context += `- Revenue Growth: ${revenueGrowth.toFixed(1)}%\n`;
      context += `- Expense Growth: ${expenseGrowth.toFixed(1)}%\n`;
      context += `- Profit Growth: ${profitGrowth.toFixed(1)}%\n`;
    }
  }

  return context;
};

export const getMentorResponse = async (
  userMessage: string,
  profile: FounderProfile | null,
  csvData: CSVData[]
): Promise<string> => {
  const context = buildRAGContext(profile, csvData);

  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an experienced startup mentor and advisor. You have access to the founder's company profile and financial data. Provide helpful, actionable advice based on this context. Be concise, practical, and encouraging.`,
    },
    {
      role: 'user',
      content: `${context}\n\nQuestion: ${userMessage}\n\nPlease provide advice based on the above context.`,
    },
  ];

  return await callOpenAIAPI(messages);
};

