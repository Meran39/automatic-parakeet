
import React from 'react';
import { useSimulationContext } from '../context/SimulationContext';
import LLMUsageChart from './LLMUsageChart'; // LLMUsageChartが使用されている場合

const LLMUsageDisplay: React.FC = () => {
  const { llmService, llmStats } = useSimulationContext(); // llmStats を追加で取得

  // llmService が null の場合を考慮
  const totalTokensUsed = llmStats.totalTokens;
  const totalCost = llmStats.totalCost;
  const averageResponseTime = llmStats.avgResponseTime; // 平均応答時間を取得

  return (
    <div className="bg-neutral-50 shadow-custom-medium rounded-lg p-4 space-y-2">
      <h3 className="text-lg font-bold text-primary-600">LLM 使用状況</h3>
      <div className="text-sm text-neutral-600">
        <p>総トークン数: {totalTokensUsed}</p>
        <p>総コスト: ${totalCost.toFixed(6)}</p>
        {/* 平均応答時間を追加 */}
        <p>平均応答時間: {averageResponseTime.toFixed(2)}ms</p>
      </div>
      {/* 必要であれば、LLMUsageChart もここに含める */}
      {/* <LLMUsageChart /> */}
    </div>
  );
};

export default LLMUsageDisplay;
