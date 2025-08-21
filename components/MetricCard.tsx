import React from 'react';
import { Card, CardContent } from '../client/src/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

export default function MetricCard({ title, value, icon, trend, color }: MetricCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-primary';
      case 'green':
        return 'bg-green-100 text-success';
      case 'yellow':
        return 'bg-yellow-100 text-warning';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card className="shadow border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`rounded-full p-3 ${getColorClasses()}`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-4">
            <span className="text-sm text-success">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
