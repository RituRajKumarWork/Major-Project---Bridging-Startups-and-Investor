'use client';

import { useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

interface CSVData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface DataLabChartProps {
  data: CSVData[];
}

export function DataLabChart({ data }: DataLabChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const exportToPNG = () => {
    if (!chartRef.current) return;

    // Create a canvas and render the chart
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 600;

    // For a proper export, we'd need to use a library like html2canvas
    // For now, we'll use a simpler approach with window.print or download as SVG
    const svg = chartRef.current.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `chart-${format(new Date(), 'yyyy-MM-dd')}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const formattedData = data.map((item) => ({
    ...item,
    month: format(new Date(item.month), 'MMM yyyy'),
    revenue: Number(item.revenue),
    expenses: Number(item.expenses),
    profit: Number(item.profit),
  }));

  if (formattedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <p className="text-muted-foreground">No data available. Upload a CSV file to see the chart.</p>
      </div>
    );
  }

  return (
    <div ref={chartRef} className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Financial Overview</h3>
        <Button onClick={exportToPNG} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Chart
        </Button>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#8884d8"
            strokeWidth={2}
            name="Revenue"
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#82ca9d"
            strokeWidth={2}
            name="Expenses"
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#ffc658"
            strokeWidth={2}
            name="Profit"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

