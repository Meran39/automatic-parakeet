
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LLMUsageChartProps {
  data: { step: number; tokens: number; cost: number }[];
}

const LLMUsageChart: React.FC<LLMUsageChartProps> = ({ data }) => {
  return (
    <div className="bg-neutral-50 rounded-xl shadow-custom-medium p-6 border border-neutral-100">
      <h3 className="text-xl font-semibold mb-4 text-neutral-800">LLM使用状況の推移</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis dataKey="step" label={{ value: 'ステップ', position: 'insideBottom', offset: 0, fill: '#475569' }} />
          <YAxis yAxisId="left" orientation="left" stroke="#00bcd4" label={{ value: 'トークン数', angle: -90, position: 'insideLeft', fill: '#475569' }} />
          <YAxis yAxisId="right" orientation="right" stroke="#ff9800" label={{ value: 'コスト ($)', angle: 90, position: 'insideRight', fill: '#475569' }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="tokens" stroke="#00bcd4" activeDot={{ r: 8 }} name="総トークン数" />
          <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#ff9800" name="総コスト" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LLMUsageChart;
