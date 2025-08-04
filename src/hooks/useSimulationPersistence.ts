import { useCallback } from 'react';
import { Agent } from '../models/Agent';
import { SavedSimulationState, LLMConfig, NamedLocation, SimulationLog } from '../types';
import { isSavedSimulationState } from '../utils/typeGuards';

interface UseSimulationPersistenceProps {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  llmProvider: LLMConfig['provider'];
  setLlmProvider: React.Dispatch<React.SetStateAction<LLMConfig['provider']>>;
  addLog: (type: SimulationLog['type'], message: string, agentId?: number) => void;
  initialLocations: NamedLocation[];
}

export const useSimulationPersistence = ({
  agents,
  setAgents,
  currentStep,
  setCurrentStep,
  llmProvider,
  setLlmProvider,
  addLog,
  initialLocations,
}: UseSimulationPersistenceProps) => {
  const saveSimulation = useCallback(() => {
    const stateToSave: SavedSimulationState = {
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        personality: agent.personality,
        memory: agent.memoryManager.getMemoryContext(),
        goals: agent.goals,
        currentLocationName: agent.currentLocationName,
        job: agent.job,
        money: agent.money,
        happiness: agent.happiness,
        hunger: agent.hunger,
        fear: agent.fear,
        shortTermPlan: agent.shortTermPlan,
        weapon: agent.weapon,
        x: agent.x,
        y: agent.y,
        targetX: agent.targetX,
        targetY: agent.targetY,
        speed: agent.speed,
        energy: agent.energy,
        mood: agent.mood,
        relationships: agent.relationships,
        receivedMessages: agent.receivedMessages,
        inventory: agent.inventory,
        targetLocationName: agent.targetLocationName,
        pendingProposals: agent.pendingProposals,
      })),
      currentStep,
      llmProvider,
    };
    localStorage.setItem('simulationState', JSON.stringify(stateToSave));
    addLog('system', 'シミュレーション状態を保存しました。');
  }, [agents, currentStep, llmProvider, addLog]);

  const loadSimulation = useCallback(() => {
    const savedState = localStorage.getItem('simulationState');
    if (savedState) {
      const parsedState: unknown = JSON.parse(savedState);

      if (parsedState !== null && isSavedSimulationState(parsedState)) {
        const state = parsedState as SavedSimulationState;
        const loadedAgents = state.agents.map(agentData => {
          const agent = new Agent(
            agentData.id,
            agentData.name,
            agentData.personality,
            agentData.goals ?? [],
            agentData.currentLocationName,
            agentData.job ?? null,
            agentData.money ?? 0,
            agentData.happiness ?? 50,
            agentData.hunger ?? 50,
            agentData.shortTermPlan ?? '',
            agentData.weapon ?? null
          );
          // その他の状態を復元
          agent.x = agentData.x ?? 0;
          agent.y = agentData.y ?? 0;
          agent.targetX = agentData.targetX ?? null;
          agent.targetY = agentData.targetY ?? null;
          agent.speed = agentData.speed ?? 10;
          agent.energy = agentData.energy ?? 100;
          agent.fear = agentData.fear ?? 0;
          agent.mood = agentData.mood ?? 'neutral';
          agent.relationships = agentData.relationships ?? {};
          agent.receivedMessages = agentData.receivedMessages ?? [];
          agent.inventory = agentData.inventory ?? {};
          agent.targetLocationName = agentData.targetLocationName ?? null;
          agent.pendingProposals = agentData.pendingProposals ?? [];
          agent.memoryManager.addMemory('loaded', new Date().toLocaleTimeString(), state.currentStep as number, agentData.memory ?? '');

          // ロケーションを再設定
          const location = initialLocations.find(loc => loc.name === agentData.currentLocationName);
          if (location) {
            agent.moveTo(location);
          }
          return agent;
        });
        setAgents(loadedAgents);
        setCurrentStep(state.currentStep ?? 0);
        setLlmProvider((state.llmProvider as LLMConfig['provider']) ?? 'ollama');
      }

      addLog('system', 'シミュレーション状態を読み込みました。');
    } else {
      addLog('system', '保存されたシミュレーション状態が見つかりませんでした。');
    }
  }, [addLog, initialLocations, setAgents, setCurrentStep, setLlmProvider]);

  return { saveSimulation, loadSimulation };
};
