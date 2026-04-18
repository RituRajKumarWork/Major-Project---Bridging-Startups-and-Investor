'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataLabChart } from '@/components/founder/DataLabChart';
import api, { getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { TrendingUp } from 'lucide-react';

interface Projection {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  reasoning: string;
}

export default function ProjectionsPage() {
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [projections, setProjections] = useState<Projection[]>([]);
  const [analysis, setAnalysis] = useState('');
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const generateProjections = async () => {
    setLoading(true);
    try {
      const [projectionsRes, historicalRes] = await Promise.all([
        api.post('/api/founders/projections/generate', { months }),
        api.get('/api/founders/csv/data'),
      ]);

      setProjections(projectionsRes.data.projections || []);
      setAnalysis(projectionsRes.data.analysis || '');
      setHistoricalData(historicalRes.data.data || []);
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const combinedData = [
    ...historicalData.map((d) => ({
      month: d.month,
      revenue: d.revenue,
      expenses: d.expenses,
      profit: d.profit,
      type: 'historical' as const,
    })),
    ...projections.map((p) => ({
      month: p.month,
      revenue: p.revenue,
      expenses: p.expenses,
      profit: p.profit,
      type: 'projection' as const,
    })),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Growth Projections
          </CardTitle>
          <CardDescription>
            AI-powered financial projections based on your historical data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="months">Projection Period (months)</Label>
              <Input
                id="months"
                type="number"
                min="1"
                max="24"
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value) || 6)}
              />
            </div>
            <Button onClick={generateProjections} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Projections'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{analysis}</p>
          </CardContent>
        </Card>
      )}

      {projections.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Projected Financials</CardTitle>
            </CardHeader>
            <CardContent>
              <DataLabChart data={combinedData as any} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projection Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projections.map((proj, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{proj.month}</h4>
                      <div className="text-right text-sm">
                        <div>Revenue: ${proj.revenue.toLocaleString()}</div>
                        <div>Expenses: ${proj.expenses.toLocaleString()}</div>
                        <div>Profit: ${proj.profit.toLocaleString()}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{proj.reasoning}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

