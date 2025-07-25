// ===============================
// src/components/AgentDetails.tsx
// ===============================
import { Agent } from '../models/Agent';
import { MoodType } from '../types';
import { User, Zap, Smile, Target, Activity } from 'lucide-react';

interface Props {
  agent: Agent | null;
  allAgents: Agent[]; // 追加
}

const AgentDetails: React.FC<Props> = ({ agent, allAgents }) => {
  const getMoodDisplay = (mood: MoodType): string => {
    switch (mood) {
      case 'happy': return '😊 幸せ';
      case 'excited': return '🤩 興奮';
      case 'neutral': return '😐 普通';
      case 'thoughtful': return '🤔 思考中';
      case 'content': return '😌 満足';
      case 'tired': return '😴 疲労';
      case 'social': return '🥳 社交的';
      case 'creative': return '💡 創造的';
      default: return '❓ 不明';
    }
  };

  if (!agent) {
    return <div className="bg-gray-800 p-4 rounded-lg">エージェントを選択してください</div>;
  }

  return (
    <div className="bg-neutral-900 p-8 rounded-xl shadow-custom-medium text-neutral-100">
      <h2 className="text-3xl font-bold mb-4 text-primary-300">{agent.name}</h2>
      <div className="space-y-3 text-lg">
        <div className="flex items-center gap-2">
          <User size={20} className="text-primary-300" />
          <p><strong>個性:</strong> {agent.personality}</p>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-primary-300" />
          <p><strong>現在の行動:</strong> {agent.state.currentAction}</p>
        </div>
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-primary-300" />
          <p><strong>エネルギー:</strong> {agent.state.energy}%</p>
        </div>
        <div className="w-full bg-neutral-700 rounded-full h-2.5">
          <div 
            className="bg-accent-400 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${agent.state.energy}%` }}
          ></div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Activity size={20} className="text-primary-300" />
          <p><strong>空腹度:</strong> {agent.state.hunger}%</p>
        </div>
        <div className="w-full bg-neutral-700 rounded-full h-2.5">
          <div 
            className="bg-red-400 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${agent.state.hunger}%` }}
          ></div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Smile size={20} className="text-primary-300" />
          <p><strong>気分:</strong> {getMoodDisplay(agent.state.mood)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Target size={20} className="text-primary-300" />
          <p><strong>短期計画:</strong> {agent.state.shortTermPlan}</p>
        </div>
        <div className="flex items-center gap-2">
          <Target size={20} className="text-primary-300" />
          <p><strong>長期目標:</strong> {agent.state.goals.join(', ') || 'なし'}</p>
        </div>
        
      </div>

      <h3 className="text-xl font-bold mt-6 text-primary-300 flex items-center gap-2">
        <User size={20} className="text-primary-300" />
        人間関係
      </h3>
      <div className="space-y-2 mt-2">
        {Object.keys(agent.relationships).length === 0 ? (
          <p className="text-neutral-400">他のエージェントとの関係性はありません。</p>
        ) : (
          Object.entries(agent.relationships).map(([agentId, strength]) => {
            const relatedAgent = allAgents.find(a => a.id.toString() === agentId);
            return (
              <div key={agentId} className="flex items-center gap-2">
                <p className="text-neutral-300">{relatedAgent ? relatedAgent.name : `エージェント ${agentId}`}: <span className="font-bold">{strength}</span></p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AgentDetails;
