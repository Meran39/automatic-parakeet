export type AgentMood = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised' | 'disgusted';

// アイテムの型定義
export type WeaponType = 'ナイフ' | '刀' | 'ピストル' | 'ライフル';
export type FoodType = 'パン' | 'おにぎり' | '水' | 'フルーツジュース' | 'エナジードリンク';
export type ItemType = WeaponType | FoodType; // 将来的に他のアイテムも追加可能

// 提案の型定義
export type ProposalType = '共同探索' | '共同戦闘' | '会議';

export interface Proposal {
  id: string;
  senderId: number;
  recipientId: number;
  type: ProposalType;
  content: string; // 提案内容のテキスト
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

import { MemoryManager } from '../services/memoryManager';

export interface IAgent {
  id: number;
  name: string;
  personality: string;
  memoryManager: MemoryManager; // 追加
  // memoryManager is a class instance, so it should be handled separately for serialization
  goals: string[];
  currentLocationName: string;
  job: Job | null;
  money: number;
  happiness: number;
  hunger: number;
  fear: number;
  shortTermPlan: string;
  weapon: Weapon | null;
  x: number;
  y: number;
  targetX: number | null;
  targetY: number | null;
  speed: number;
  energy: number;
  mood: AgentMood;
  relationships: { [agentId: string]: number };
  receivedMessages: Message[];
  inventory: { [item in ItemType]?: number };
  targetLocationName: string | null;
  pendingProposals: Proposal[];

  // Methods from Agent class
  updateState(newState: Partial<IAgent>): void;
  moveTo(location: NamedLocation): void;
  arriveAtLocation(locationName: string): void;
  move(): void;
  changeMoney(amount: number): void;
  adjustEnergy(amount: number): void;
  adjustFear(amount: number): void;
  adjustHappiness(amount: number): void;
  adjustHunger(amount: number): void;
  attack(target: IZombie): number;
  updateMood(mood: AgentMood): void;
  updateRelationship(agentId: string, change: number): void;
  receiveMessage(message: Message): void;
  addItemToInventory(item: ItemType, quantity: number): void;
  hasItemInInventory(item: ItemType): boolean;
  removeItemFromInventory(item: ItemType): void;
  consumeItem(item: ItemType): void;
}

export interface LLMConfig {
  provider: 'huggingface' | 'openai' | 'anthropic' | 'ollama';
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  baseUrl?: string;
}

export interface NamedLocation {
  name: string;
  x: number;
  y: number;
  type: string;
  width: number;
  height: number;
  resources?: { [item in ItemType]?: { chance: number; maxQuantity: number } }; // 場所で見つかるリソース
  health?: number;
  ownerAgentId?: number;
}

export interface Job {
  name: string;
  salary: number;
}

export interface Weapon {
  name: WeaponType;
  damage: number;
  range: number;
  type: 'melee' | 'ranged';
}

export interface Food {
  name: FoodType;
  hungerRecovery: number;
  happinessBonus?: number;
}

export interface Message {
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
}

export interface SimulationLog {
  type: 'system' | 'action' | 'info' | 'error';
  message: string;
  timestamp: string;
  agentId?: number;
}

export interface IZombie {
  id: number;
  x: number;
  y: number;
  health: number;
  targetAgentId: number | null;
  takeDamage: (amount: number) => void;
}

export type ActionType = '移動' | '物資を調達する' | '待機' | 'メッセージを送信' | 'アイテムを渡す' | '提案する' | '提案に応答する' | 'ゾンビを攻撃';

export interface ActionResponse {
  action: ActionType;
  plan: string;
  mood: string;
  energy: number;
  targetLocation?: string;
  isMessage?: boolean;
  recipientName?: string;
  messageContent?: string;
  happiness?: number;
  hunger?: number;
  targetId?: number;
  itemName?: ItemType; // アイテムを渡す場合
  proposalType?: ProposalType; // 提案の種類
  proposalRecipientName?: string; // 提案の相手
  proposalContent?: string; // 提案の内容
  proposalId?: string; // 応答する提案のID
  proposalResponse?: 'accept' | 'reject'; // 提案への応答
}

export class LLMServiceError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'LLMServiceError';
  }
}

export class DecisionError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DecisionError';
  }
}

// SavedAgentData interface for serializable agent properties
export interface SavedAgentData {
  id: number;
  name: string;
  personality: string;
  memory: string; // Storing summarized memory as string
  goals: string[];
  currentLocationName: string;
  job: Job | null;
  money: number;
  happiness: number;
  hunger: number;
  fear: number;
  shortTermPlan: string;
  weapon: Weapon | null;
  x: number;
  y: number;
  targetX: number | null;
  targetY: number | null;
  speed: number;
  energy: number;
  mood: AgentMood;
  relationships: { [agentId: string]: number };
  receivedMessages: Message[];
  inventory: { [item in ItemType]?: number };
  targetLocationName: string | null;
  pendingProposals: Proposal[];
}

export interface SavedZombieData {
  id: number;
  x: number;
  y: number;
  health: number;
  targetAgentId: number | null;
}

export interface SavedSimulationState {
  agents: SavedAgentData[]; // Use SavedAgentData for serialization
  zombies: SavedZombieData[]; // Add zombies to saved state
  currentStep: number;
  llmProvider: LLMConfig['provider'];
}

export interface ActionHistory {
  action: string;
  timestamp: string;
  step: number;
  context: string;
}

export interface AttackEffect {
  id: string;
  type: 'bullet' | 'slash';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  timestamp: number;
}
