import React from 'react';
import { useSimulationContext } from '../context/SimulationContext';
import AgentVisualization from './AgentVisualization';
import ControlPanel from './ControlPanel';
import SimulationLogs from './SimulationLogs';
import CollapsibleSection from './CollapsibleSection';
import LLMUsageDisplay from './LLMUsageDisplay';
import AgentDetails from './AgentDetails';

const SimulationContent: React.FC = () => {
  const { selectedAgent, agents } = useSimulationContext();

  return (
    <div className="flex flex-col md:flex-row md:h-screen bg-neutral-50 font-sans text-neutral-900">
      <div className="w-full md:w-1/3 p-4 overflow-y-auto bg-neutral-50 shadow-lg flex flex-col space-y-4">
        <h1 className="text-2xl font-bold text-primary-700">仮想世界シミュレーション</h1>
        <CollapsibleSection title="シミュレーション制御">
          <ControlPanel />
        </CollapsibleSection>
        <CollapsibleSection title="エージェント詳細" initialOpen={true}>
          <AgentDetails agent={selectedAgent} allAgents={agents} />
        </CollapsibleSection>
        <CollapsibleSection title="LLM 使用状況" initialOpen={false}>
          <LLMUsageDisplay />
        </CollapsibleSection>
      </div>
      <div className="w-full md:w-2/3 p-4 flex flex-col space-y-4">
        <CollapsibleSection title="エージェントの可視化">
          <AgentVisualization />
        </CollapsibleSection>
        <CollapsibleSection title="シミュレーションログ" initialOpen={true}>
          <SimulationLogs />
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default SimulationContent;