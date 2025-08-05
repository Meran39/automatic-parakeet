import React from 'react';
import { Agent } from '../models/Agent';

interface AgentDetailsProps {
  agent: Agent | null;
  allAgents: Agent[];
}

// プログレスバーコンポーネント
const ProgressBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center space-x-2">
    <span className="font-semibold text-sm w-24 flex-shrink-0">{label}:</span>
    <div className="w-full bg-neutral-200 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full ${color}`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
    <span className="text-sm w-8 text-right flex-shrink-0">{value.toFixed(0)}</span>
  </div>
);

const AgentDetails: React.FC<AgentDetailsProps> = ({ agent, allAgents }) => {
  if (!agent) {
    return <div className="p-4 bg-neutral-100 rounded-lg">エージェントを選択してください</div>;
  }

  const getAgentNameById = (id: number) => {
    const foundAgent = allAgents.find(a => a.id === id);
    return foundAgent ? foundAgent.name : '不明';
  };

  return (
    <div className="bg-neutral-50 shadow-custom-medium rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-bold text-primary-600">{agent.name} (ID: {agent.id})</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <p><span className="font-semibold">個性:</span> {agent.personality}</p>
        <p><span className="font-semibold">現在の場所:</span> {agent.currentLocationName}</p>
        <p><span className="font-semibold">所持金:</span> {agent.money}G</p>
        <p><span className="font-semibold">職業:</span> {agent.job ? agent.job.name : 'なし'}</p>
        <p><span className="font-semibold">武器:</span> {agent.weapon ? agent.weapon.name : 'なし'}</p>
      </div>
      <div className="space-y-2">
        <ProgressBar label="エネルギー" value={agent.energy} color="bg-green-500" />
        <ProgressBar label="幸福度" value={agent.happiness} color="bg-yellow-500" />
        <ProgressBar label="空腹度" value={agent.hunger} color="bg-red-500" />
      </div>
      <div>
        <h4 className="font-semibold text-primary-500">短期計画:</h4>
        <p className="text-sm bg-neutral-50 p-2 rounded">{agent.shortTermPlan}</p>
      </div>
      <div>
        <h4 className="font-semibold text-primary-500">記憶の要約:</h4>
        <p className="text-sm bg-neutral-50 p-2 rounded h-24 overflow-y-auto">{agent.memoryManager.getMemoryContext()}</p>
      </div>
      <div>
        <h4 className="font-semibold text-primary-500">人間関係:</h4>
        <ul className="text-sm list-disc list-inside">
          {Object.entries(agent.relationships).map(([agentId, strength]) => (
            <li key={agentId}>{getAgentNameById(parseInt(agentId))}: {strength}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-primary-500">インベントリ:</h4>
        <ul className="text-sm list-disc list-inside">
          {Object.entries(agent.inventory).map(([item, quantity]) => (
            <li key={item}>{item}: {quantity}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-primary-500">受信メッセージ:</h4>
        <ul className="text-sm list-disc list-inside h-24 overflow-y-auto">
          {agent.receivedMessages.map((msg, index) => (
            <li key={index}>From {getAgentNameById(msg.senderId)}: {msg.content}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AgentDetails;