import { useState, useEffect, useCallback } from 'react';
import { Brain } from 'lucide-react';
import { Agent } from './models/Agent';
import { LLMService } from './services/llm';
import { DecisionManager } from './services/decisionManager';
import { CostOptimizer } from './services/costOptimizer';
import { SimulationLog, LLMConfig, NamedLocation, Job, Zombie, Weapon } from './types';
import AgentVisualization from './components/AgentVisualization';
import AgentDetails from './components/AgentDetails';
import SimulationLogs from './components/SimulationLogs';
import ControlPanel from './components/ControlPanel';

import CollapsibleSection from './components/CollapsibleSection';

const LOCATIONS: NamedLocation[] = [
  { name: '自宅', x: 100, y: 100, type: 'home', width: 50, height: 50, ownerAgentId: 1, resources: [] },
  { name: '花子の家', x: 100, y: 100, type: 'home', width: 50, height: 50, ownerAgentId: 2, resources: [] },
  { name: '公園', x: 300, y: 200, type: 'park', width: 80, height: 80, resources: [] },
  { name: '図書館', x: 150, y: 300, type: 'library', width: 60, height: 60, resources: [] },
  { name: 'カフェ', x: 400, y: 150, type: 'cafe', width: 40, height: 40, resources: [] },
  
  { name: 'スーパー', x: 250, y: 50, type: 'supermarket', width: 60, height: 60, resources: ['食料', '水'] },
  { name: '雑貨屋', x: 50, y: 250, type: 'general_store', width: 50, height: 50, resources: ['日用品', '工具'] },
  { name: '拠点', x: 200, y: 200, type: 'base', width: 100, height: 100, resources: ['食料', '水', '医療品', '武器'], health: 500 },
];

function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [llmService, setLlmService] = useState<LLMService | null>(null);
  const [decisionManager, setDecisionManager] = useState<DecisionManager | null>(null);
  const [llmProvider, setLlmProvider] = useState<string>('ollama');
  const [simulationSpeed, setSimulationSpeed] = useState<number>(500); // デフォルト0.5秒 (リアルタイム感を向上)
  
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);
  const [zombies, setZombies] = useState<Zombie[]>([]); // ゾンビの状態を追加
  const [baseHealth, setBaseHealth] = useState<number>(LOCATIONS.find(loc => loc.type === 'base')?.health || 0); // 拠点の体力を追加

  // ログ追加関数
  const addLog = useCallback((type: SimulationLog['type'], message: string, timestamp: string, agentId?: number) => {
    setLogs(prev => [...prev, { type, message, timestamp, agentId }]);
    console.log(`[${type.toUpperCase()}] ${timestamp} ${agentId ? `(Agent ${agentId}) ` : ''}${message}`); // デバッグ用
  }, []);

  // エージェント間メッセージ送信関数
  const sendMessage = useCallback((sender: Agent, recipientName: string, content: string) => {
    const recipient = agents.find(a => a.name === recipientName);
    if (recipient) {
      recipient.receiveMessage({
        senderId: sender.id,
        recipientId: recipient.id, // ここを追加
        content: content,
        timestamp: new Date().toLocaleTimeString()
      });
      // 送信者側でも受信者との関係性を強化
      const currentStrength = sender.relationships[recipient.id.toString()] || 0;
      sender.updateRelationship(recipient.id.toString(), currentStrength + 3);

      addLog('info', `${sender.name} が ${recipient.name} にメッセージを送信: "${content}"`, new Date().toLocaleTimeString(), sender.id);
    }
  }, [agents, addLog]);

  // 環境変数からLLM設定を取得
  const getLLMConfig = (provider: string): LLMConfig => {
    const configs = {
      huggingface: {
        provider: 'huggingface' as const,
        model: import.meta.env.VITE_DEFAULT_MODEL || 'rinna/japanese-gpt2-medium',
        temperature: 0.7,
        maxTokens: 50,
        apiKey: import.meta.env.VITE_HUGGING_FACE_TOKEN || '',
        baseUrl: import.meta.env.VITE_HUGGING_FACE_BASE_URL || undefined
      },
      openai: {
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100,
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
      },
      anthropic: {
        provider: 'anthropic' as const,
        model: 'claude-3-sonnet-20240229',
        temperature: 0.7,
        maxTokens: 100,
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || ''
      },
      ollama: {
        provider: 'ollama' as const,
        model: import.meta.env.VITE_OLLAMA_MODEL || 'llama2',
        temperature: 0.7,
        maxTokens: 500,
        apiKey: '', // Ollamaは通常APIキー不要
        baseUrl: import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434'
      }
    };
    return configs[provider as keyof typeof configs] || configs.huggingface;
  };

  // 初期化
  useEffect(() => {
    const config = getLLMConfig(llmProvider);
    const newCostOptimizer = new CostOptimizer();
    const newLlmService = new LLMService(config, newCostOptimizer);
    setLlmService(newLlmService);
    setDecisionManager(new DecisionManager(newLlmService));
    
    // 初期エージェントを作成
    const initialAgents = [
      new Agent(1, "太郎", "好奇心旺盛で読書好きな研究者", "新しい街に引っ越してきたばかり", ["新しい友達を作る", "地域の図書館を見つける"], '自宅', { name: '研究者', salary: 100 }, 500, 50, 50, "図書館で新しい本を探す", { name: 'ナイフ', damage: 20, range: 5, type: 'melee' }),
      new Agent(2, "花子", "社交的で料理が得意な主婦", "近所の人たちと仲良くなりたい", ["地域のコミュニティに参加する", "新しいレシピを覚える"], '花子の家', null, 800, 50, 50, "近所の人たちと交流する", { name: 'ピストル', damage: 30, range: 50, type: 'ranged' }),
      new Agent(3, "次郎", "静かで内省的な芸術家", "芸術的なインスピレーションを求めている", ["新しい作品を完成させる", "静かな創作空間を見つける"], 'カフェ', { name: 'カフェ店員', salary: 50 }, 500, 50, 50, "カフェで創作活動をする", { name: '鈍器', damage: 25, range: 5, type: 'melee' }),
      new Agent(4, "美咲", "活発でスポーツ好きな学生", "健康的な生活を心がけている", ["マラソン大会に参加する", "運動仲間を見つける"], '公園', null, 300, 50, 50, "公園でジョギングする", { name: 'ライフル', damage: 40, range: 100, type: 'ranged' }),
      new Agent(5, "健太", "技術好きで創造的なエンジニア", "新しいプロジェクトに取り組みたい", ["オープンソースプロジェクトに貢献する", "技術コミュニティを作る"], '拠点', { name: 'エンジニア', salary: 120 }, 500, 50, 50, "拠点で新しいプロジェクトに取り組む", { name: 'ショットガン', damage: 50, range: 30, type: 'ranged' })
    ];
    
    // 初期位置を設定
    initialAgents.forEach(agent => {
      const location = LOCATIONS.find(l => l.name === agent.currentLocationName);
      if (location) {
        agent.moveTo(location);
      }
    });

    setAgents(initialAgents);
    setSelectedAgent(initialAgents[0]);
    
    addLog('system', 'シミュレーション初期化完了', new Date().toLocaleTimeString());
  }, [llmProvider, addLog]);



  // 単一エージェントの行動を更新
  const updateAgentAction = useCallback(async (agent: Agent): Promise<void> => {
    if (!decisionManager) {
      addLog('error', `エラー: ${agent.name} - decisionManagerが初期化されていません。`, new Date().toLocaleTimeString(), agent.id);
      return;
    }
    
    try {
      addLog('info', `プロンプト生成: ${agent.name}`, new Date().toLocaleTimeString(), agent.id);
      addLog('debug', `LLMへの行動決定リクエスト開始: ${agent.name}`, new Date().toLocaleTimeString(), agent.id);
      const response = await decisionManager.decideAction(agent, currentStep + 1, LOCATIONS, agents, zombies);
      addLog('debug', `LLMからの行動決定レスポンス受信: ${agent.name}`, new Date().toLocaleTimeString(), agent.id);
      addLog('debug', `LLMレスポンス詳細 (plan): ${response.plan}`, new Date().toLocaleTimeString(), agent.id);
      addLog('debug', `LLMレスポンス詳細 (action): ${response.action}`, new Date().toLocaleTimeString(), agent.id);
      addLog('debug', `LLMレスポンス詳細 (mood): ${response.mood}`, new Date().toLocaleTimeString(), agent.id);
      addLog('debug', `LLMレスポンス詳細 (energy): ${response.energy}`, new Date().toLocaleTimeString(), agent.id);
      addLog('debug', `LLMレスポンス詳細 (targetLocation): ${response.targetLocation}`, new Date().toLocaleTimeString(), agent.id);
      const timestamp = new Date().toLocaleTimeString();
      
      // エージェントの状態を更新
      agent.addToMemory(response.action, timestamp, currentStep + 1);
      if (response.plan) {
        agent.updateState({ shortTermPlan: response.plan });
      }
      
      // 受信メッセージを処理（LLMに影響を与えるなど、今後の拡張ポイント）
      if (agent.receivedMessages.length > 0) {
        addLog('info', `${agent.name} がメッセージを処理しました。`, new Date().toLocaleTimeString(), agent.id);
        // ここでLLMを呼び出してメッセージを解釈させたり、状態に影響を与えたりするロジックを追加可能
        // agent.updateState({ receivedMessages: [] }); // 処理後クリアはしない
      }

      // 行動に基づいてメッセージを送信
      if (response.isMessage && response.recipientName && response.messageContent) {
        sendMessage(agent, response.recipientName, response.messageContent);
      }

      // 行動に基づいて場所を移動
      if (response.targetLocation) {
        const trimmedTargetLocation = response.targetLocation.trim();
        const newLocation = LOCATIONS.find(l => l.name === trimmedTargetLocation);
        if (newLocation) {
          agent.moveTo(newLocation);
          addLog('info', `${agent.name} が ${newLocation.name} へ移動しました。`, timestamp, agent.id);
        } else {
          addLog('info', `${agent.name} は不明な場所 '${trimmedTargetLocation}' への移動を試みました。`, timestamp, agent.id);
          // 不明な場所への移動を試みた場合、現在の場所にとどまるか、デフォルトの場所へ移動させるなどのフォールバック
          // 例: agent.moveTo(LOCATIONS.find(l => l.name === agent.currentLocationName) || LOCATIONS[0]);
        }
      } else if (response.action && response.action.includes('移動')) {
        // targetLocationが返されなかったが、行動が移動を示唆する場合のフォールバック
        addLog('info', `${agent.name} は移動を試みましたが、移動先が指定されませんでした。`, timestamp, agent.id);
        // 例: agent.moveTo(LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]); // ランダムな場所へ移動
      }

      // 行動に基づいて仕事をする
      if (response.action === "仕事をする") {
        if (agent.job && agent.currentLocationName === '職場') {
          agent.changeMoney(agent.job.salary);
          addLog('action', `${agent.name} は仕事をして ${agent.job.salary}G 稼ぎました。現在の所持金: ${agent.money}G`, timestamp, agent.id);
        } else if (agent.job && agent.currentLocationName !== '職場') {
          addLog('info', `${agent.name} は職場にいないため仕事ができませんでした。`, timestamp, agent.id);
        } else {
          addLog('info', `${agent.name} は職業がないため仕事ができませんでした。`, timestamp, agent.id);
        }
      }

      // 行動に基づいて物資を調達する
      if (response.action && response.action.startsWith('物資を調達する')) {
        const currentLocation = LOCATIONS.find(loc => loc.name === agent.currentLocationName);
        if (currentLocation && currentLocation.resources && currentLocation.resources.length > 0) {
          currentLocation.resources.forEach(resource => {
            agent.addItemToInventory(resource, 1); // 各物資を1つ追加
            addLog('action', `${agent.name} は ${currentLocation.name} で ${resource} を調達しました。`, timestamp, agent.id);
          });
        } else {
          addLog('info', `${agent.name} は ${agent.currentLocationName} で調達できる物資がありませんでした。`, timestamp, agent.id);
        }
      }

      if (response.mood) {
        agent.updateMood(response.mood);
      }
      
      if (response.energy !== undefined && typeof response.energy === 'number' && !isNaN(response.energy)) {
        agent.updateState({ energy: Math.max(0, Math.min(100, response.energy)) }); // 0-100の範囲にクランプ
      } else {
        // LLMが不適切なエネルギー値を返した場合、デフォルトのエネルギー変化を適用
        agent.adjustEnergy(Math.random() * 20 - 10);
        addLog('info', `${agent.name} のエネルギー値が不適切だったため、デフォルトのエネルギー変化を適用しました。`, timestamp, agent.id);
      }

      if (response.happiness) {
        agent.adjustHappiness(response.happiness - agent.happiness);
      }

      if (response.hunger) {
        agent.adjustHunger(response.hunger - agent.hunger);
      }
      
      addLog('action', `${agent.name}: ${response.action}`, timestamp, agent.id);
      
    } catch (error) {
      console.error(`Error updating agent ${agent.name}:`, error);
      addLog('error', `エラー: ${agent.name} - ${error instanceof Error ? error.message : '不明なエラー'}`, new Date().toLocaleTimeString(), agent.id);
    }
  }, [currentStep, addLog, sendMessage, agents, decisionManager]);

  // シミュレーションステップを実行
  const runSimulationStep = useCallback(async () => {
    console.log('runSimulationStep: Start');

    if (agents.length === 0) {
      addLog('system', 'ゲームオーバー: 全てのエージェントが倒れました。', new Date().toLocaleTimeString());
      setIsRunning(false);
      return;
    }

    const baseLocation = LOCATIONS.find(loc => loc.type === 'base');
    if (baseLocation && baseHealth <= 0) {
      addLog('system', `ゲームオーバー: 拠点 (${baseLocation.name}) が破壊されました。`, new Date().toLocaleTimeString());
      setIsRunning(false);
      return;
    }

    if (!llmService || isProcessing) {
      console.log('runSimulationStep: llmService not initialized or already processing');
      return;
    }

    setIsProcessing(true);
    const stepStart = Date.now();
    const newStep = currentStep + 1;

    addLog('system', `--- ステップ ${newStep} 開始 ---`, new Date().toLocaleTimeString());
    console.log(`runSimulationStep: Step ${newStep} started`);

    try {
      // ゾンビの出現ロジック
      if (newStep % 5 === 0) {
        const newZombieId = zombies.length > 0 ? Math.max(...zombies.map(z => z.id)) + 1 : 1;
        const MAP_WIDTH = 500;
        const MAP_HEIGHT = 400;
        const spawnSide = Math.floor(Math.random() * 4); // 0:上, 1:右, 2:下, 3:左

        let zombieX = 0;
        let zombieY = 0;

        switch (spawnSide) {
          case 0: // 上から
            zombieX = Math.random() * MAP_WIDTH;
            zombieY = 0;
            break;
          case 1: // 右から
            zombieX = MAP_WIDTH;
            zombieY = Math.random() * MAP_HEIGHT;
            break;
          case 2: // 下から
            zombieX = Math.random() * MAP_WIDTH;
            zombieY = MAP_HEIGHT;
            break;
          case 3: // 左から
            zombieX = 0;
            zombieY = Math.random() * MAP_HEIGHT;
            break;
          default:
            zombieX = 0;
            zombieY = 0;
        }

        const newZombie: Zombie = {
          id: newZombieId,
          x: zombieX,
          y: zombieY,
          health: 500,
          targetAgentId: null,
        };

        setZombies(prevZombies => {
          const newZombies = [...prevZombies, newZombie];
          console.log(`runSimulationStep: Current zombies array:`, newZombies); // Debug log
          return newZombies;
        });
        addLog('system', `ゾンビ (ID:${newZombieId}) が出現しました！`, new Date().toLocaleTimeString());
        console.log(`runSimulationStep: Zombie ${newZombieId} spawned at (${zombieX}, ${zombieY})`); // Debug log
      }

      const updatedAgents = (await Promise.all(agents.map(async (agent) => {
        console.log(`runSimulationStep: Processing agent ${agent.name}`); // Debug log
        // エージェントの行動を決定
        await updateAgentAction(agent);

        // エージェントが移動中の場合、移動を継続
        if (agent.targetX !== null && agent.targetY !== null) {
          agent.move();
          console.log(`runSimulationStep: Agent ${agent.name} moving to (${agent.targetX}, ${agent.targetY})`); // Debug log
        }

        // 10ステップごとに記憶を要約
        if (newStep % 10 === 0) {
          await agent.summarizeMemory(llmService);
          addLog('info', `${agent.name} の記憶が要約されました。`, new Date().toLocaleTimeString(), agent.id);
          console.log(`runSimulationStep: Agent ${agent.name} memory summarized`); // Debug log
        }

        // エージェントのエネルギーが0以下になったら死亡
        if (agent.energy <= 0) {
          addLog('system', `${agent.name} (ID:${agent.id}) はエネルギーが尽きて倒れました...`, new Date().toLocaleTimeString(), agent.id);
          console.log(`runSimulationStep: Agent ${agent.name} died`); // Debug log
          return null; // このエージェントをリストから削除
        }
        return agent;
      }))).filter(agent => agent !== null) as Agent[];
      setAgents(updatedAgents);
      console.log('runSimulationStep: Agents updated'); // Debug log

      // 各ステップで空腹度を増加させ、幸福度を減少させる
      updatedAgents.forEach(agent => {
        agent.adjustHunger(5); // 空腹度を5増加
        agent.adjustHappiness(-2); // 幸福度を2減少

        // 物資の消費
        if (agent.hunger >= 70 && agent.hasItemInInventory('食料')) {
          agent.removeItemFromInventory('食料');
          agent.adjustHunger(-50); // 食料消費で空腹度を減少
          addLog('action', `${agent.name} は食料を消費して空腹度を回復しました。`, new Date().toLocaleTimeString(), agent.id);
          console.log(`runSimulationStep: Agent ${agent.name} consumed food`); // Debug log
        }
        if (agent.energy <= 30 && agent.hasItemInInventory('医療品')) {
          agent.removeItemFromInventory('医療品');
          agent.adjustEnergy(50); // 医療品消費でエネルギーを回復
          addLog('action', `${agent.name} は医療品を消費してエネルギーを回復しました。`, new Date().toLocaleTimeString(), agent.id);
          console.log(`runSimulationStep: Agent ${agent.name} consumed medical supplies`); // Debug log
        }
      });
      
      // ゾンビの移動ロジック
      let currentZombies = zombies.map(zombie => {
        // 最も近いエージェントまたは拠点をターゲットにする
        let targetX = 0;
        let targetY = 0;
        let minDistance = Infinity;

        // エージェントをターゲットにする
        agents.forEach(agent => {
          const dist = Math.sqrt(Math.pow(zombie.x - agent.x, 2) + Math.pow(zombie.y - agent.y, 2));
          if (dist < minDistance) {
            minDistance = dist;
            targetX = agent.x;
            targetY = agent.y;
          }
        });

        // 拠点をターゲットにする
        const baseLocation = LOCATIONS.find(loc => loc.type === 'base');
        if (baseLocation) {
          const dist = Math.sqrt(Math.pow(zombie.x - baseLocation.x, 2) + Math.pow(zombie.y - baseLocation.y, 2));
          if (dist < minDistance) {
            minDistance = dist;
            targetX = baseLocation.x;
            targetY = baseLocation.y;
          }
        }

        // ゾンビをターゲットに向かって移動させる
        const speed = 5; // ゾンビの移動速度
        const dx = targetX - zombie.x;
        const dy = targetY - zombie.y;
        const angle = Math.atan2(dy, dx);

        const newX = zombie.x + Math.cos(angle) * speed;
        const newY = zombie.y + Math.sin(angle) * speed;
        console.log(`runSimulationStep: Zombie ${zombie.id} moved from (${zombie.x.toFixed(2)}, ${zombie.y.toFixed(2)}) to (${newX.toFixed(2)}, ${newY.toFixed(2)})`); // Added log
        return { ...zombie, x: newX, y: newY };
      });
      console.log('runSimulationStep: Zombies moved'); // Debug log

      // ゾンビとエージェントの衝突判定とダメージ処理
      currentZombies.forEach(zombie => {
        agents.forEach(agent => {
          const dist = Math.sqrt(Math.pow(zombie.x - agent.x, 2) + Math.pow(zombie.y - agent.y, 2));
          if (dist < 15) { // 衝突判定距離 (ゾンビとエージェントの半径の合計)
            // ゾンビがエージェントにダメージを与える
            agent.adjustEnergy(-10); // エージェントのエネルギーを減らす
            addLog('action', `${agent.name} はゾンビ (ID:${zombie.id}) からダメージを受けました！ エネルギー: ${agent.energy}`, new Date().toLocaleTimeString(), agent.id);

            // エージェントがゾンビにダメージを与える (基本的な戦闘)
            const agentDamage = agent.weapon ? agent.weapon.damage : 10; // 武器のダメージを適用
            zombie.health -= agentDamage; // ゾンビの体力を減らす
            addLog(
              'action',
              `${agent.name} がゾンビ (ID:${zombie.id}) に ${agent.weapon ? agent.weapon.name : '素手'} で反撃しました！ ${zombie.id} の体力: ${zombie.health}`,
              new Date().toLocaleTimeString(),
              agent.id
            );
            if (zombie.health <= 0) {
              addLog('system', `ゾンビ (ID:${zombie.id}) を撃退しました！`, new Date().toLocaleTimeString());
              console.log(`runSimulationStep: Zombie ${zombie.id} defeated`); // Debug log
            } else {
              addLog('info', `ゾンビ (ID:${zombie.id}) の残り体力: ${zombie.health}`, new Date().toLocaleTimeString());
            }
          }
        });
      });

      // Filter out dead zombies after all damage is applied
      const updatedZombies = currentZombies.filter(zombie => zombie.health > 0);
      setZombies(updatedZombies);
      console.log('runSimulationStep: Zombies collision handled'); // Debug log

      // ゾンビと拠点の衝突判定とダメージ処理
      if (baseLocation && baseHealth > 0) { // 拠点が存在し、体力が0より大きい場合のみ処理
        updatedZombies.forEach(zombie => {
          const dist = Math.sqrt(Math.pow(zombie.x - baseLocation.x, 2) + Math.pow(zombie.y - baseLocation.y, 2));
          if (dist < (baseLocation.width / 2) + 10) { // 衝突判定距離 (拠点とゾンビの半径の合計)
            // ゾンビが拠点にダメージを与える
            const damageToBase = 5; // ゾンビが拠点に与えるダメージ
            setBaseHealth(prevHealth => {
              const newHealth = Math.max(0, prevHealth - damageToBase);
              if (newHealth <= 0) {
                addLog('system', `ゲームオーバー: 拠点 (${baseLocation.name}) が破壊されました。`, new Date().toLocaleTimeString());
                setIsRunning(false);
                console.log('runSimulationStep: Base destroyed'); // Debug log
              } else {
                addLog('action', `ゾンビ (ID:${zombie.id}) が拠点にダメージを与えました！ 拠点の体力: ${newHealth}`, new Date().toLocaleTimeString());
                console.log(`runSimulationStep: Zombie ${zombie.id} attacked base, health: ${newHealth}`); // Debug log
              }
              return newHealth;
            });
          }
        });
      }

      setCurrentStep(newStep);
      setAgents([...agents]); // 再レンダリングをトリガー
      
      

      const stepEnd = Date.now();
      addLog('system', `ステップ ${newStep} 完了 (${stepEnd - stepStart}ms)`, new Date().toLocaleTimeString());

    } catch (error) {
      console.error("シミュレーションステップ実行中にエラーが発生しました:", error);
      addLog('error', `シミュレーションステップ実行中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`, new Date().toLocaleTimeString());
    } finally {
      setIsProcessing(false); // 処理完了を通知
    }
  }, [agents, addLog, baseHealth, llmService, currentStep, updateAgentAction, isProcessing, zombies]);


  const toggleRunning = useCallback(() => {
    setIsRunning(prev => {
      const next = !prev;
      addLog('system', next ? '自動実行開始' : '自動実行停止', new Date().toLocaleTimeString());
      return next;
    });
  }, [addLog]);

  const resetSimulation = useCallback(() => {
    // エージェントの状態をリセット
    setAgents(prevAgents => prevAgents.map(agent => {
      agent.updateState({
        currentAction: '',
        energy: 100,
        mood: 'neutral',
        memory: '',
        summarizedMemory: ''
      });
      agent.resetMemory();
      return agent;
    }));
    setZombies([]); // ゾンビもリセット
    setCurrentStep(0);
    setIsRunning(false);
    
    setBaseHealth(LOCATIONS.find(loc => loc.type === 'base')?.health || 0); // 拠点の体力を初期値に戻す

    try {
      addLog('system', 'シミュレーションリセット完了', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('シミュレーションリセット中にエラーが発生しました:', error);
      addLog('error', 'シミュレーションリセット中にエラーが発生しました', new Date().toLocaleTimeString());
    }
  }, [addLog]);

  const clearLogs = () => {
    setLogs([]);
  };

  const handleProviderChange = (provider: string) => {
    setLlmProvider(provider);
    addLog('system', `LLMプロバイダーを${provider}に変更`, new Date().toLocaleTimeString());
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    addLog('info', `エージェント ${agent.name} を選択`, new Date().toLocaleTimeString());
  };

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
      const newAgentId = agents.length > 0 ? Math.max(...agents.map(a => a.id)) + 1 : 1;
      const newAgent = new Agent(
        newAgentId,             // id
        name,                   // name
        personality,            // personality
        "",                     // initialMemory
        [],                     // goals
        initialLocationName,    // initialLocationName
        job,                    // job
        initialMoney,           // initialMoney
        initialHappiness,       // initialHappiness
        initialHunger,          // initialHunger
        "特に計画なし",         // initialShortTermPlan
        initialWeapon           // initialWeapon
      );

      const location = LOCATIONS.find(l => l.name === newAgent.currentLocationName);
      if (location) {
        newAgent.moveTo(location);
      }

      setAgents(prevAgents => [...prevAgents, newAgent]);
      addLog(
        'system',
        `${name} (ID:${newAgentId}) がシミュレーションに参加しました。`,
        new Date().toLocaleTimeString()
      );
    },
    [agents, addLog]
  );

  const handleLocationSelect = (locationName: string | null) => {
    setSelectedLocationName(locationName);
    addLog('info', `場所 ${locationName || 'すべて'} を選択`, new Date().toLocaleTimeString());
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden font-sans text-neutral-900">
      {/* メインコンテンツエリア (AgentVisualization) */}
      <div className="flex-grow relative">
        <AgentVisualization
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentSelect={handleAgentSelect}
          locations={LOCATIONS}
          selectedLocationName={selectedLocationName}
          onLocationSelect={handleLocationSelect}
          zombies={zombies}
        />
      </div>

      {/* サイドバー (UI要素) */}
      <div className="w-1/3 bg-neutral-50 p-4 overflow-y-auto shadow-lg flex flex-col space-y-4">
        {/* ヘッダー */}
        <div className="bg-neutral-50 rounded-xl shadow-custom-medium p-4 border border-neutral-100 w-full">
          <h1 className="text-2xl font-extrabold text-primary-700 mb-1 flex items-center gap-2">
            <Brain className="text-primary-500 w-6 h-6" />
            仮想住民シミュレーション
          </h1>
          <p className="text-neutral-600 text-sm">
            LLM完全委譲による創造的な仮想住民の行動シミュレーション
          </p>
        </div>

        {/* 制御パネル */}
        <CollapsibleSection title="シミュレーション制御">
          <ControlPanel
            isRunning={isRunning}
            currentStep={currentStep}
            onToggleRunning={toggleRunning}
            onRunStep={runSimulationStep}
            onReset={resetSimulation}
            isProcessing={isProcessing}
            llmProvider={llmProvider}
            onProviderChange={handleProviderChange}
            onAddAgent={addAgent}
            availableLocations={LOCATIONS}
            simulationSpeed={simulationSpeed}
            onSpeedChange={setSimulationSpeed}
            totalTokensUsed={llmService?.totalTokensUsed || 0}
            totalCost={llmService?.totalCost || 0}
          />
        </CollapsibleSection>

        {/* エージェント詳細 */}
        <CollapsibleSection title="エージェント詳細" initialOpen={false}>
          <AgentDetails 
            agent={selectedAgent} 
            allAgents={agents}
          />
        </CollapsibleSection>

        {/* ログ */}
        <CollapsibleSection title="シミュレーションログ" initialOpen={false}>
          <SimulationLogs logs={logs} onClearLogs={clearLogs} />
        </CollapsibleSection>

        
      </div>
    </div>
  );
}

export default App;