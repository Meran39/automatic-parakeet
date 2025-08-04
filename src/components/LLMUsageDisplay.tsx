
import React from 'react';
import { useSimulationContext } from '../context/SimulationContext';

const LLMUsageDisplay: React.FC = React.memo(() => {
  const { llmService } = useSimulationContext();

  const totalTokensUsed = llmService?.totalTokensUsed || 0;
  const totalCost = llmService?.totalCost || 0;

  return (
    <div className="bg-neutral-50 shadow-custom-medium rounded-lg p-4 space-y-2">
      <h4 className="text-md font-semibold text-primary-600 mb-2">LLM 使用統計</h4>
      <p className="text-sm text-neutral-600">
        総トークン数: <span className="font-mono text-neutral-800">{totalTokensUsed}</span>
      </p>
      <p className="text-sm text-neutral-600">
        総コスト: <span className="font-mono text-neutral-800">${totalCost.toFixed(6)}</span>
      </p>
    </div>
  );
});

export default LLMUsageDisplay;
