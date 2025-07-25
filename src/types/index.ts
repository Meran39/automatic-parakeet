// ===============================
// src/types/index.ts
// ===============================
export interface Purchase {
  itemName: string;
  cost: number;
}

export interface Job {
  name: string;
  salary: number;
}

export interface AgentState {
  id: number;
  name: string;
  personality: string;
  memory: string;
  currentAction: string;
  energy: number;
  mood: MoodType;
  happiness: number; // 新しく追加
  hunger: number;    // 新しく追加
  location: Location; // 物理座標
  currentLocationName: string; // 現在いる場所の名前
  goals: string[];
  shortTermPlan: string; // 短期計画を追加
  relationships: Record<string, number>; // agent_id -> relationship_strength
  receivedMessages: Message[]; // 新しく追加
  summarizedMemory: string; // 新しく追加
  money: number; // 所持金を追加
  job: Job | null; // 職業を追加
  weapon: Weapon | null; // 武器を追加
  inventory: Record<string, number>; // インベントリを追加 (物資名 -> 数量)
}

export interface Message {
  senderId: number;
  recipientId: number; // 新しく追加
  content: string;
  timestamp: string;
}

export interface ActionHistory {
  action: string;
  timestamp: string;
  step: number;
  context?: string;
}

export interface Location {
  x: number;
  y: number;
}

export interface NamedLocation extends Location {
  name: string;
  type: 'home' | 'supermarket' | 'general_store' | 'park' | 'work' | 'library' | 'cafe' | 'base' | 'other'; // 場所の種類を追加
  width: number; // 場所の幅を追加
  height: number; // 場所の高さを追加
  ownerAgentId?: number; // 場所の所有者エージェントIDを追加
  resources?: string[]; // その場所で調達できる物資のリスト (例: '食料', '医療品')
  health?: number; // 拠点の体力を追加
}

export const MoodTypes = [
  'happy',
  'neutral',
  'excited',
  'thoughtful',
  'content',
  'tired',
  'social',
  'creative',
] as const;

export type MoodType = typeof MoodTypes[number];

export interface SimulationLog {
  type: 'system' | 'action' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: string;
  agentId?: number;
}

export type LLMProvider = 'huggingface' | 'openai' | 'anthropic' | 'ollama';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
  baseUrl?: string;
}

export interface LLMResponse {
  action: string;
  reasoning?: string;
  mood?: MoodType;
  energy?: number;
  happiness?: number; // 新しく追加
  hunger?: number;    // 新しく追加
}

export interface ActionResponse extends LLMResponse {
  plan?: string; // 計画を追加
  isMessage?: boolean;
  recipientName?: string;
  messageContent?: string;
  targetLocation?: string; 
  purchase?: Purchase; // 購入アクションを追加
}

export interface Zombie {
  id: number;
  x: number;
  y: number;
  health: number;
  targetAgentId: number | null; // ターゲットとなるエージェントのID
}

export interface Weapon {
  name: string;
  damage: number;
  range: number; // 射程距離
  type: 'melee' | 'ranged';
}
