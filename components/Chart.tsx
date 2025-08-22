"use client";

import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '../client/src/components/ui/card';

interface ChartProps {
  type: 'bar' | 'doughnut' | 'line';
  title?: string;
  data: {
    labels: string[];
    datasets: Array<{
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderRadius?: number;
      borderWidth?: number;
      fill?: boolean;
      tension?: number;
    }>;
  };
  options?: any;
}

export default function Chart({ type, title, data, options = {} }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const loadChart = async () => {
      // Dynamically import Chart.js to avoid SSR issues
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      // Destroy existing chart if it exists
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Double-check canvas is still available after async import
      if (!canvasRef.current) return;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const chartConfig: any = {
        type,
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...options,
        },
      };

      if (type === 'bar') {
        chartConfig.options.plugins = {
          legend: {
            display: false,
          },
        };
        chartConfig.options.scales = {
          y: {
            beginAtZero: true,
          },
        };
      } else if (type === 'doughnut') {
        chartConfig.options.plugins = {
          legend: {
            position: 'bottom' as const,
          },
        };
      }

      chartRef.current = new Chart(ctx, chartConfig);
    };

    loadChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [type, data]);

  return (
    <Card className="shadow border border-gray-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="relative h-64">
          <canvas ref={canvasRef} />
        </div>
      </CardContent>
    </Card>
  );
}
