import { Zombie as ZombieClass } from '../models/Zombie';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Agent } from '../models/Agent';
import { NamedLocation, Job, Weapon, SimulationLog, LLMServiceError, DecisionError, LLMConfig, AttackEffect } from '../types';

import { LLMService } from '../services/llm';
import { DecisionManager } from '../services/decisionManager';
import { CostOptimizer } from '../services/costOptimizer';
import { WEAPONS, FOOD } from '../config/gameData';
import { useSimulationActions } from '../hooks/useSimulationActions';
import { useSimulationPersistence } from '../hooks/useSimulationPersistence';

/**
 * シミュレーションコンテキストが提供するデータと関数の型定義。
 */
interface SimulationContextType {
  // 状態
  agents: Agent[];
  locations: NamedLocation[];
  logs: SimulationLog[];
  isRunning: boolean;
  currentStep: number;
  llmService: LLMService | null;
  decisionManager: DecisionManager | null;
  llmProvider: LLMConfig['provider'];
  simulationSpeed: number;
  selectedAgent: Agent | null;
  selectedLocationName: string | null;
  zombies: ZombieClass[];
  attackEffects: AttackEffect[];

  // 状態更新関数
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
  setSimulationSpeed: (speed: number) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  setSelectedLocationName: (locationName: string | null) => void;
  setZombies: (zombies: ZombieClass[]) => void;
  setAttackEffects: (effects: AttackEffect[]) => void;
}

// コンテキストのデフォルト値
const defaultContextValue: SimulationContextType = {
  agents: [],
  locations: [],
  logs: [],
  isRunning: false,
  currentStep: 0,
  llmService: null,
  decisionManager: null,
  llmProvider: 'ollama',
  simulationSpeed: 500,
  selectedAgent: null,
  selectedLocationName: null,
  zombies: [],
  attackEffects: [],
  setLlmProvider: () => {},
  toggleRunning: () => {},
  runSimulationStep: async () => {},
  resetSimulation: () => {},
  addLog: () => {},
  addAgent: () => {},
  clearLogs: () => {},
  saveSimulation: () => {},
  loadSimulation: () => {},
  setSimulationSpeed: () => {},
  setSelectedAgent: () => {},
  setSelectedLocationName: () => {},
  setZombies: () => {},
  setAttackEffects: () => {},
};

const SimulationContext = createContext<SimulationContextType>(defaultContextValue);

interface SimulationProviderProps {
  children: ReactNode;
  initialLocations: NamedLocation[];
}

/**
 * シミュレーションの状態とロジックを提供するReactコンポーネント。
 * このProvider内で、エージェント、ログ、実行状態など、シミュレーション全体の管理が行われる。
 * @param {SimulationProviderProps} props - 初期ロケーションと子要素。
 */
export const SimulationProvider: React.FC<SimulationProviderProps> = ({
  children,
  initialLocations,
}) => {
  // --- 状態管理 (useState) ---
  const [agents, setAgents] = useState<Agent[]>([]);
  const [locations] = useState<NamedLocation[]>(initialLocations);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(500);
  const [llmProvider, setLlmProvider] = useState<LLMConfig['provider']>('ollama');
  const [llmService, setLlmService] = useState<LLMService | null>(null);
  const [decisionManager, setDecisionManager] = useState<DecisionManager | null>(null);
  const [selectedAgent, setSelectedAgentState] = useState<Agent | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);
  const [zombies, setZombies] = useState<ZombieClass[]>([]);
  const [attackEffects, setAttackEffects] = useState<AttackEffect[]>([]);
  const [zombieSpawnCounter, setZombieSpawnCounter] = useState<number>(0);
  const [nextZombieSpawnStep, setNextZombieSpawnStep] = useState<number>(10);

  // --- Refによる最新値の保持 ---
  // 非同期ループ内で最新の状態を参照するためにrefを使用
  const currentStepRef = useRef(currentStep);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  const isRunningRef = useRef(isRunning);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  const simulationSpeedRef = useRef(simulationSpeed);
  useEffect(() => { simulationSpeedRef.current = simulationSpeed; }, [simulationSpeed]);

  // --- 副作用 (useEffect) ---

  // LLMプロバイダーが変更された際に、LLMServiceとDecisionManagerを再初期化する
  useEffect(() => {
    const costOptimizer = new CostOptimizer();
    const defaultModel: string = import.meta.env.VITE_DEFAULT_MODEL ?? 'llama3';
    const newLlmService = new LLMService({ provider: llmProvider, model: defaultModel, temperature: 0.2, maxTokens: 500, apiKey: '', baseUrl: import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434' }, costOptimizer);
    setLlmService(newLlmService);
    setDecisionManager(new DecisionManager(newLlmService));
    console.log('LLM Service and Decision Manager initialized.');
  }, [llmProvider]);

  // --- コールバック関数 (useCallback) ---

  const addLog = useCallback((type: SimulationLog['type'], message: string, agentId?: number) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { type, message, timestamp, agentId }]);
  }, []);

  /**
   * シミュレーションを初期状態にリセットする。
   * 初期エージェントを生成し、ログやステップ数をクリアする。
   */
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
  }, [addLog, locations]);

  // コンポーネントマウント時に一度だけシミュレーションを初期化する
  useEffect(() => {
    initializeSimulation();
  }, [initializeSimulation]);

  // カスタムフックからアクション関連の関数を取得
  const { handleMoveAction, handleWaitAction, handleScavengeAction, handleGiveItemAction, handleProposeAction, handleRespondToAction, handleAttackAction, handleSendMessageAction } = useSimulationActions({
    agents,
    locations,
    zombies,
    addLog,
    setZombies,
  });

  /**
   * シミュレーションの1ステップを実行するメインロジック。
   * 全エージェントの行動決定、状態更新、ゾンビの行動、新規ゾンビの出現などを処理する。
   */
  const runSimulationStep = useCallback(async () => {
    if (!llmService || !decisionManager) {
      // サービスが準備できていなければ少し待つ
      setTimeout(() => { runSimulationStepRef.current(); }, 100);
      return;
    }

    const currentStepValue = currentStepRef.current;
    addLog('system', `--- ステップ ${currentStepValue + 1} ---`);

    // 1. 全エージェントの行動を並行して決定
    const agentPromises = agents.map(async (agent) => {
      // ... (感情更新、LLMによる行動決定など)
      try {
        const response = await decisionManager.decideAction(agent, currentStepValue + 1, locations, agents, zombies);
        return { agent, response };
      } catch (error) {
        // ... (エラーハンドリング)
        return { agent, response: null };
      }
    });
    const resolvedAgentActions = await Promise.all(agentPromises);

    // 2. 決定された行動を全エージェントに適用
    for (const { agent, response } of resolvedAgentActions) {
      if (!response) continue;
      // ... (行動に応じた状態変化の適用)
    }

    // 3. エージェントの内部状態を更新 (空腹度、幸福度など)
    const updatedAgents = agents.map(agent => {
      // ... (状態更新ロジック)
      return agent;
    });
    setAgents(updatedAgents.filter(agent => agent.energy > 0));

    // 4. ゾンビの状態を更新 (移動、攻撃)
    setZombies(prevZombies => {
      // ... (ゾンビの行動ロジック)
      return prevZombies.filter(zombie => zombie.health > 0);
    });

    // 5. 新規ゾンビの出現判定
    setZombieSpawnCounter(prev => prev + 1);
    if (zombieSpawnCounter >= nextZombieSpawnStep) {
      // ... (ゾンビ出現ロジック)
    }

    setCurrentStep(currentStepValue + 1);

    // ★ステップの最後に統計情報を更新
    if (llmService) {
      setLlmStats({
        totalTokens: llmService.totalTokensUsed,
        totalCost: llmService.totalCost,
        avgResponseTime: llmService.getAverageResponseTime(),
      });
    }

    // 6. isRunningがtrueなら、次のステップをスケジュール
    if (isRunningRef.current) {
      setTimeout(() => { runSimulationStepRef.current(); }, simulationSpeedRef.current);
    }
  }, [agents, locations, llmService, decisionManager, addLog, zombies, zombieSpawnCounter, nextZombieSpawnStep, handleMoveAction, handleWaitAction, handleScavengeAction, handleGiveItemAction, handleProposeAction, handleRespondToAction, handleAttackAction, handleSendMessageAction, setZombies]);

  // runSimulationStep関数をrefに保持して、常に最新の関数を参照できるようにする
  const runSimulationStepRef = useRef(runSimulationStep);
  useEffect(() => {
    runSimulationStepRef.current = runSimulationStep;
  }, [runSimulationStep]);

  // isRunning状態が変更されたときにシミュレーションループを開始/停止する
  useEffect(() => {
    if (isRunning) {
      runSimulationStepRef.current();
    }
  }, [isRunning]);

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const resetSimulation = useCallback(() => {
    initializeSimulation();
  }, [initializeSimulation]);

  /**
   * 新しいエージェントをシミュレーションに追加する。
   */
  const addAgent = useCallback(
    (name: string, personality: string, initialLocationName: string, job: Job | null, initialMoney: number, initialHappiness: number, initialHunger: number, initialWeapon: Weapon | null) => {
      const newAgent = new Agent(agents.length + 1, name, personality, [], initialLocationName, job, initialMoney, initialHappiness, initialHunger, '', initialWeapon, addLog);
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

  // 保存・ロード機能のためのカスタムフック
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

  const setSelectedAgent = useCallback((agent: Agent | null) => {
    setSelectedAgentState(agent);
  }, []);

  // コンテキストとして提供する値
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
    llmStats,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
};

/**
 * SimulationContextに簡単にアクセスするためのカスタムフック。
 * @returns {SimulationContextType} シミュレーションのコンテキスト。
 */
export const useSimulationContext = (): SimulationContextType => {
  const context = useContext<SimulationContextType>(SimulationContext);
  return context;
};