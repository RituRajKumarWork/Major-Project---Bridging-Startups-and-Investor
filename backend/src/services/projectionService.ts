import { FounderProfile } from '../types';
import { CSVData } from '../types';
import { callOpenAIAPI, OpenAIMessage } from './grokService';

export interface Projection {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  reasoning: string;
}

export const generateProjections = async (
  profile: FounderProfile | null,
  csvData: CSVData[],
  months: number = 6
): Promise<{ projections: Projection[]; analysis: string }> => {
  if (csvData.length < 3) {
    throw new Error('Insufficient historical data. Need at least 3 months of data.');
  }

  // Prepare historical data summary
  const historicalSummary = csvData
    .slice(-12)
    .map(d => ({
      month: d.month.toISOString().split('T')[0],
      revenue: d.revenue,
      expenses: d.expenses,
      profit: d.profit,
    }));

  // Calculate trends
  const recentData = csvData.slice(-3);
  const avgRevenueGrowth = calculateAverageGrowth(recentData.map(d => d.revenue));
  const avgExpenseGrowth = calculateAverageGrowth(recentData.map(d => d.expenses));
  const lastMonth = csvData[csvData.length - 1];

  const context = `
Founder Profile:
- Company: ${profile?.company_name || 'N/A'}
- Domain: ${profile?.domain || 'N/A'}
- Funding Stage: ${profile?.funding_stage || 'N/A'}
- Valuation: $${profile?.valuation.toLocaleString() || 'N/A'}

Historical Financial Data (Last 12 months):
${JSON.stringify(historicalSummary, null, 2)}

Recent Trends:
- Average Revenue Growth Rate: ${avgRevenueGrowth.toFixed(2)}% per month
- Average Expense Growth Rate: ${avgExpenseGrowth.toFixed(2)}% per month
- Last Month: Revenue=$${lastMonth.revenue.toLocaleString()}, Expenses=$${lastMonth.expenses.toLocaleString()}, Profit=$${lastMonth.profit.toLocaleString()}

Please generate ${months} months of future projections based on this data. Consider:
1. Historical trends and growth rates
2. Funding stage and typical growth patterns
3. Industry benchmarks
4. Realistic assumptions about scaling

For each month, provide:
- Projected revenue
- Projected expenses
- Projected profit
- Brief reasoning for the projection
`;

  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are a financial analyst specializing in startup growth projections. Analyze the provided data and generate realistic, data-driven projections. Be conservative but optimistic. Format your response as JSON with this structure:
{
  "analysis": "Overall analysis of the company's financial trajectory",
  "projections": [
    {
      "month": "YYYY-MM-DD",
      "revenue": number,
      "expenses": number,
      "profit": number,
      "reasoning": "Brief explanation"
    }
  ]
}`,
    },
    {
      role: 'user',
      content: context,
    },
  ];

  const response = await callOpenAIAPI(messages);

  // Try to parse JSON response
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        projections: parsed.projections || [],
        analysis: parsed.analysis || response,
      };
    }
  } catch (error) {
    console.error('Failed to parse JSON from OpenAI response:', error);
  }

  // Fallback: generate simple projections based on trends
  const projections: Projection[] = [];
  let currentRevenue = lastMonth.revenue;
  let currentExpenses = lastMonth.expenses;

  for (let i = 1; i <= months; i++) {
    const nextMonth = new Date(lastMonth.month);
    nextMonth.setMonth(nextMonth.getMonth() + i);

    currentRevenue = currentRevenue * (1 + avgRevenueGrowth / 100);
    currentExpenses = currentExpenses * (1 + avgExpenseGrowth / 100);
    const profit = currentRevenue - currentExpenses;

    projections.push({
      month: nextMonth.toISOString().split('T')[0],
      revenue: Math.round(currentRevenue),
      expenses: Math.round(currentExpenses),
      profit: Math.round(profit),
      reasoning: `Based on historical growth trends`,
    });
  }

  return {
    projections,
    analysis: response,
  };
};

const calculateAverageGrowth = (values: number[]): number => {
  if (values.length < 2) return 0;
  const growthRates: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) {
      growthRates.push(((values[i] - values[i - 1]) / values[i - 1]) * 100);
    }
  }
  return growthRates.length > 0
    ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
    : 0;
};

