import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { DailyBalance, AppSettings, ThemeColors } from '../types';

interface Props {
  data: DailyBalance[];
  settings: AppSettings;
  themeColors: ThemeColors;
}

const CashFlowChart: React.FC<Props> = ({ data, settings, themeColors }) => {
  const formatYAxis = (value: number) => {
    if (settings.currencyInK) return `${(value / 1000).toFixed(0)}k`;
    return `€${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded text-sm z-50">
          <p className="font-bold mb-2" style={{ color: themeColors.text }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {settings.currencyInK ? `€${(entry.value / 1000).toFixed(2)}k` : `€${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const tickFormatter = (val: string) => {
      const date = new Date(val);
      // For longer ranges (> 30 days usually, but here checking array length roughly), show year? 
      // Actually standardizing on DD/MM is usually best for "Cashflow" unless it spans years.
      // If data.length is huge, Recharts handles density automatically.
      
      if (data.length > 30) {
          return `${date.getDate()}/${date.getMonth() + 1}`;
      }
      return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div className="w-full h-[400px] bg-white rounded-lg shadow-sm p-4 print:border print:border-gray-300">
      <h3 className="text-lg font-bold mb-4" style={{ color: themeColors.text }}>
         Verwachte Liquiditeit ({data.length} Dagen)
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            tickFormatter={tickFormatter}
            minTickGap={30} // Prevent overcrowding for long ranges
          />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          <ReferenceLine y={0} stroke={themeColors.highRisk} strokeDasharray="3 3" />

          <Bar 
            dataKey="incoming" 
            name="Inkomsten" 
            fill={themeColors.lowRisk} 
            barSize={20} 
            fillOpacity={0.8} 
          />
          <Bar 
            dataKey="outgoing" 
            name="Uitgaven" 
            fill={themeColors.highRisk} 
            barSize={20} 
            fillOpacity={0.8} 
          />
          
          <Line 
            type="monotone" 
            dataKey="balance" 
            name="Netto Saldo" 
            stroke={themeColors.primary} 
            strokeWidth={3} 
            dot={data.length < 30 ? { r: 4, fill: themeColors.primary, strokeWidth: 2, stroke: '#fff' } : false}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;