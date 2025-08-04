import { Zombie as ZombieClass } from '../models/Zombie';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Agent } from '../models/Agent';
import { NamedLocation, Job, Weapon, SimulationLog, LLMServiceError, DecisionError, LLMConfig, AttackEffect } from '../types';

import { LLMService } from '../services/llm';
import { DecisionManager } from '../services/decisionManager';
import { CostOptimizer } from '../services/costOptimizer';
import { WEAPONS, FOOD } from '../config/gameData';
import { useSimulationActions } from '../hooks/useSimulationActions';

interface SimulationContextType {
  agents: Agent[];
  locations: NamedLocation[];
  logs: SimulationLog[];
  isRunning: boolean;
  currentStep: number;
  llmService: LLMService | null;
  decisionManager: DecisionManager | null;
  llmProvider: LLMConfig['provider'];
  setLlmProvider: (provider: LLMConfig['provider']) => void;
  toggleRunning: () => void;
  runSimulationStep: () => Promise<void>;
  resetSimulation: () => void;
  addLog: (type: SimulationLog['type'], message: string, agentId?: number) => void;
  addAgent: (
    name: string,
    personality: string,
    initialLocationName: string,
    job: Job | null,
    initialMoney: number,
    initialHappiness: number,
    initialHunger: number,
    initialWeapon: Weapon | null
  ) => void;
  clearLogs: () => void;
  saveSimulation: () => void;
  loadSimulation: () => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;
  selectedLocationName: string | null;
  setSelectedLocationName: (locationName: string | null) => void;
  zombies: ZombieClass[];
  setZombies: (zombies: ZombieClass[]) => void;
  attackEffects: AttackEffect[]; // 追加
  setAttackEffects: (effects: AttackEffect[]) => void; // 追加
}

const defaultContextValue: SimulationContextType = {
  agents: [],
  locations: [],
  logs: [],
  isRunning: false,
  currentStep: 0,
  llmService: null,
  decisionManager: null,
  llmProvider: 'ollama',
  setLlmProvider: () => {},
  toggleRunning: () => {},
  runSimulationStep: async () => {},
  resetSimulation: () => {},
  addLog: () => {},
  addAgent: () => {},
  clearLogs: () => {},
  saveSimulation: () => {},
  loadSimulation: () => {},
  simulationSpeed: 500,
  setSimulationSpeed: () => {},
  selectedAgent: null,
  setSelectedAgent: () => {},
  selectedLocationName: null,
  setSelectedLocationName: () => {},
  zombies: [],
  setZombies: () => {},
  attackEffects: [],
  setAttackEffects: () => {},
};

const SimulationContext = createContext<SimulationContextType>(defaultContextValue);

import { useSimulationPersistence } from '../hooks/useSimulationPersistence';

interface SimulationProviderProps {
  children: ReactNode;
  initialLocations: NamedLocation[];
}

export const SimulationProvider: React.FC<SimulationProviderProps> = ({
  children,
  initialLocations,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [locations] = useState<NamedLocation[]>(initialLocations);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepRef = useRef(currentStep);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const [simulationSpeed, setSimulationSpeed] = useState<number>(500);
  const simulationSpeedRef = useRef(simulationSpeed);
  useEffect(() => {
    simulationSpeedRef.current = simulationSpeed;
  }, [simulationSpeed]);

  const [llmProvider, setLlmProvider] = useState<LLMConfig['provider']>('ollama');
  const [llmService, setLlmService] = useState<LLMService | null>(null);
  const [decisionManager, setDecisionManager] = useState<DecisionManager | null>(null);

  useEffect(() => {
    const costOptimizer = new CostOptimizer();
    const defaultModel: string = import.meta.env.VITE_DEFAULT_MODEL ?? 'llama3';
    const newLlmService = new LLMService({ provider: llmProvider, model: defaultModel, temperature: 0.2, maxTokens: 500, apiKey: '', baseUrl: import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434' }, costOptimizer);
    console.log('SimulationContext.tsx - VITE_DEFAULT_MODEL used:', defaultModel);
    setLlmService(newLlmService);
    setDecisionManager(new DecisionManager(newLlmService));
    console.log('LLM Service and Decision Manager initialized.');
  }, [llmProvider]);

  const [selectedAgent, setSelectedAgentState] = useState<Agent | null>(null);
  const setSelectedAgent = useCallback((agent: Agent | null) => {
    console.log('SimulationContext.tsx - setSelectedAgent called with:', agent);
    setSelectedAgentState(agent);
  }, []);
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);
  const [zombies, setZombies] = useState<ZombieClass[]>([]);
  const [attackEffects, setAttackEffects] = useState<AttackEffect[]>([]);
  const [zombieSpawnCounter, setZombieSpawnCounter] = useState<number>(0);
  const [nextZombieSpawnStep, setNextZombieSpawnStep] = useState<number>(10);

  const addLog = useCallback((type: SimulationLog['type'], message: string, agentId?: number) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { type, message, timestamp, agentId }]);
  }, []);

  const initializeSimulation = useCallback(() => {
    console.log('initializeSimulation called');
    const initialAgents = [
      new Agent(1, 'Alice', '好奇心旺盛', ['友達を作る', '図書館に行く'], '自宅', { name: '研究者', salary: 100 }, 500, 50, 50, "図書館で新しい本を探す", WEAPONS['ナイフ'], addLog),
      new Agent(2, 'Bob', '用心深い', ['安全な場所を見つける', '食料を確保する'], '公園', null, 800, 50, 50, "食料を探す", WEAPONS['ピストル'], addLog),
    ];

    initialAgents.forEach(agent => {
      const location = locations.find(loc => loc.name === agent.currentLocationName);
      if (location) {
        agent.x = location.x;
        agent.y = location.y;
      }
    });

    setAgents(initialAgents);
    setLogs([]);
    setCurrentStep(0);
    setIsRunning(false);
    setSelectedLocationName(null);
    addLog('system', 'シミュレーションを初期化しました。');
    console.log('Simulation initialized.');
  }, [addLog, locations]);

  useEffect(() => {
    console.log('useEffect (initializeSimulation) fired');
    initializeSimulation();
  }, [initializeSimulation]);

  const { handleMoveAction, handleWaitAction, handleScavengeAction, handleGiveItemAction, handleProposeAction, handleRespondToAction, handleAttackAction, handleSendMessageAction } = useSimulationActions({
    agents,
    locations,
    zombies,
    addLog,
    setZombies,
    setAttackEffects,
  });

  const runSimulationStep = useCallback(async () => {
    console.log('runSimulationStep called.');
    if (!llmService || !decisionManager) {
      console.log('LLM Service or Decision Manager not initialized yet.', { llmService, decisionManager });
      // LLMサービスが初期化されていない場合は、少し待ってから再試行
      setTimeout(() => {
        runSimulationStepRef.current();
      }, 100); // 100ms後に再試行
      return;
    }

    const currentStepValue = currentStepRef.current; // useRefから最新のcurrentStepを取得
    addLog('system', `--- ステップ ${currentStepValue + 1} ---`);

    const agentPromises = agents.map(async (agent) => {
      // 感情の更新（恐怖心）
      const nearbyZombies = zombies.filter(zombie => {
        const distance = Math.sqrt(Math.pow(agent.x - zombie.x, 2) + Math.pow(agent.y - zombie.y, 2));
        return distance < 100; // 100ユニット以内にいるゾンbiを「近く」と定義
      });

      if (nearbyZombies.length > 0) {
        agent.adjustFear(nearbyZombies.length * 5); // 近くのゾンビの数に応じて恐怖心が増加
      } else {
        agent.adjustFear(-10); // 近くにゾンbiがいなければ恐怖心は徐々に減少
      }

      // 強制攻撃ロジック
      let performedForcedAttack = false;
      const nearbyAttackableZombies = zombies.filter(zombie => {
        const distance = Math.sqrt(Math.pow(agent.x - zombie.x, 2) + Math.pow(agent.y - zombie.y, 2));
        return agent.weapon && distance <= agent.weapon.range;
      });

      if (performedForcedAttack) {
        console.log(`${agent.name} performed forced attack.`);
        return { agent, response: null }; // 強制攻撃を実行した場合、LLMへの問い合わせはスキップ
      }

      try {
        console.log(`${agent.name} is deciding action...`);
        const response = await decisionManager.decideAction(agent, currentStepValue + 1, locations, agents, zombies);
        console.log(`${agent.name} decided action:`, response);
        return { agent, response };
      } catch (error) {
        if (error instanceof LLMServiceError) {
          addLog('error', `LLMサービスエラー: ${error.message}`, agent.id);
        } else if (error instanceof DecisionError) {
          addLog('error', `行動決定エラー: ${error.message}`, agent.id);
        } else {
          addLog('error', `エージェント ${agent.name} の行動決定で不明なエラー: ${error instanceof Error ? error.message : '不明なエラー'}`, agent.id);
        }
        console.error(`エージェント ${agent.name} の行動決定でエラー:`, error);
        return { agent, response: null }; // エラーが発生してもエージェントの状態は維持
      }
    });

    const resolvedAgentActions = await Promise.all(agentPromises);
    console.log('All agent actions processed.', resolvedAgentActions);

    for (const { agent, response } of resolvedAgentActions) {
      if (!response) continue; // 強制攻撃などでresponseがない場合はスキップ

      agent.updateState({
        shortTermPlan: response.plan,
        energy: response.energy,
      });

      if (typeof response.action === 'string') {
        switch (response.action) {
            case '移動':
              handleMoveAction(agent, response);
              break;
            case '待機':
              handleWaitAction(agent);
              break;
            case '物資を調達する':
              handleScavengeAction(agent);
              break;
            case 'アイテムを渡す':
              handleGiveItemAction(agent, response);
              break;
            case '提案する':
              handleProposeAction(agent, response);
              break;
            case '提案に応答する':
              handleRespondToAction(agent, response);
              break;
            case 'ゾンビを攻撃':
              handleAttackAction(agent, response);
              break;
            case 'メッセージを送信':
              handleSendMessageAction(agent, response);
              break;
            default:
              addLog('error', `${agent.name}が不明な行動「${response.action}」を試みました。`, agent.id);
          }
        }

        addLog('action', `${agent.name}: ${response.action}`, agent.id);
        agent.memoryManager.addMemory(response.action, new Date().toLocaleTimeString(), currentStepValue + 1, `場所: ${agent.currentLocationName}`);
    }

    const updatedAgents = agents.map(agent => {
      agent.adjustHunger(-0.5); // 毎ステップ空腹度が減少

      // 幸福度の更新ロジック
      if (agent.hunger < 30) {
        agent.adjustHappiness(-1); // 空腹だと不幸になる
      }
      if (agent.fear < 10) {
        agent.adjustHappiness(0.5); // 安全だと幸福度が上がる
      }

      // 空腹時に食料を消費するロジック
      if (agent.hunger < 20) {
        const foodItem = Object.values(FOOD).find(f => agent.inventory[f.name] !== undefined && agent.inventory[f.name] > 0);
        if (foodItem) {
          agent.consumeItem(foodItem.name);
          addLog('action', `${agent.name}は空腹のため${foodItem.name}を食べた。`, agent.id);
        } else {
          addLog('info', `${agent.name}は空腹だが、食料を持っていない。`, agent.id);
        }
      }

      if (agent.targetX !== null && agent.targetY !== null) {
        agent.move();
      }
      return agent;
    });

    const aliveAgents = updatedAgents.filter(agent => agent.energy > 0);
    setAgents(aliveAgents);

    setZombies(prevZombies => prevZombies.filter(zombie => zombie.health > 0));

    // ゾンビの移動ロジック
    setZombies(prevZombies => {
      const zombiesToProcess = prevZombies.filter(zombie => {
        let closestAgent: Agent | null = null;
        let minDistance = Infinity;

        for (const agent of agents) {
          const distance = Math.sqrt(Math.pow(zombie.x - agent.x, 2) + Math.pow(zombie.y - agent.y, 2));
          if (distance < minDistance) {
            minDistance = distance;
            closestAgent = agent;
          }
        }
        return closestAgent !== null; // closestAgentがnullでないゾンビのみをフィルタリング
      });

      return zombiesToProcess.map(zombie => {
        let closestAgent: Agent = null as any; // TypeScriptにAgent型であることを伝えるための仮の代入
        let minDistance = Infinity;

        for (const agent of agents) {
          const distance = Math.sqrt(Math.pow(zombie.x - agent.x, 2) + Math.pow(zombie.y - agent.y, 2));
          if (distance < minDistance) {
            minDistance = distance;
            closestAgent = agent;
          }
        }

        // ゾンビがエージェントを攻撃
        const damage = zombie.attackAgent(closestAgent);
        if (damage > 0) {
          closestAgent.adjustEnergy(-damage);
          addLog('action', `ゾンビ (ID: ${zombie.id}) が ${closestAgent.name} に ${damage} ダメージを与えました。${closestAgent.name}の残りエネルギー: ${closestAgent.energy.toFixed(2)}`, zombie.id);
        }
        zombie.moveTowardsAgent(closestAgent);
        return zombie;
      });
    });

    // ゾンビ出現ロジック
    setZombieSpawnCounter(prev => prev + 1);
    if (zombieSpawnCounter >= nextZombieSpawnStep) {
      const newZombieId = zombies.length > 0 ? Math.max(...zombies.map(z => z.id)) + 1 : 1;
      const zombieY = Math.random() * 400;
      const newZombie = new (ZombieClass!)(newZombieId, 500, zombieY, 100); // Zombie クラスのインスタンスを生成
      setZombies(prevZombies => [...prevZombies, newZombie]);
      addLog('system', `新しいゾンビ (ID: ${newZombieId}) が出現しました！`, newZombieId);
      setZombieSpawnCounter(0); // カウンターをリセット
      setNextZombieSpawnStep(Math.floor(Math.random() * 20) + 10); // 次の出現ステップをランダムに設定 (10〜29ステップ)
    }

    setCurrentStep(currentStepValue + 1);

    // 自己スケジュール化
    if (isRunningRef.current) {
      setTimeout(() => {
        runSimulationStepRef.current();
      }, simulationSpeedRef.current);
    }

  }, [agents, locations, llmService, decisionManager, addLog, currentStepRef, handleMoveAction, handleWaitAction, handleScavengeAction, handleGiveItemAction, handleProposeAction, handleRespondToAction, handleAttackAction, setZombies, setAttackEffects, zombieSpawnCounter, nextZombieSpawnStep, handleSendMessageAction]);

  const runSimulationStepRef = useRef(runSimulationStep);

  useEffect(() => {
    runSimulationStepRef.current = runSimulationStep;
  }, [runSimulationStep]);

  // シミュレーションループの開始/停止を制御するuseEffect
  useEffect(() => {
    console.log('useEffect (simulation loop) fired. isRunning:', isRunning);
    if (isRunning) {
      console.log('Starting simulation timer...');
      // シミュレーション開始時に一度だけrunSimulationStepを呼び出す
      runSimulationStepRef.current();
    } else {
      console.log('Simulation is paused or stopped.');
    }
  }, [isRunning]); // isRunningのみを依存配列にする

  const toggleRunning = useCallback(() => {
    console.log('toggleRunning called. Current isRunning:', isRunning);
    setIsRunning(prev => !prev);
  }, [isRunning]);

  const resetSimulation = useCallback(() => {
    initializeSimulation();
  }, [initializeSimulation]);

  const addAgent = useCallback(
    (
      name: string,
      personality: string,
      initialLocationName: string,
      job: Job | null,
      initialMoney: number,
      initialHappiness: number,
      initialHunger: number,
      initialWeapon: Weapon | null
    ) => {
      const newAgent = new Agent(
        agents.length + 1,
        name,
        personality,
        [],
        initialLocationName,
        job,
        initialMoney,
        initialHappiness,
        initialHunger,
        '',
        initialWeapon,
        addLog // addLogを渡す
      );
      const location = locations.find(l => l.name === initialLocationName);
      if (location) {
        newAgent.moveTo(location);
      }
      setAgents(prevAgents => [...prevAgents, newAgent]);
      addLog('system', `エージェント ${name} が追加されました。`);
    },
    [agents, locations, addLog]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const { saveSimulation, loadSimulation } = useSimulationPersistence({
    agents,
    setAgents,
    currentStep,
    setCurrentStep,
    llmProvider,
    setLlmProvider,
    addLog,
    initialLocations,
    zombies,
    setZombies,
  });

  const value = {
    agents,
    locations,
    logs,
    isRunning,
    currentStep,
    llmService,
    decisionManager,
    llmProvider,
    setLlmProvider,
    toggleRunning,
    runSimulationStep,
    resetSimulation,
    addLog,
    addAgent,
    clearLogs,
    saveSimulation,
    loadSimulation,
    simulationSpeed,
    setSimulationSpeed,
    selectedAgent,
    setSelectedAgent,
    selectedLocationName,
    setSelectedLocationName,
    zombies,
    setZombies,
    attackEffects,
    setAttackEffects,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
};

export const useSimulationContext = (): SimulationContextType => {
  const context = useContext<SimulationContextType>(SimulationContext);
  return context;
};