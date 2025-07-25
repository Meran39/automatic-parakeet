// ===============================
// src/models/Agent.ts
// ===============================
import {
  AgentState,
  MoodType,
  Location,
  Message,
  NamedLocation,
  Job,
  Weapon,
  MoodTypes,
} from '../types';
import { MemoryManager } from '../services/memoryManager';

export class Agent {
  
  public state: AgentState;
  public targetX: number | null = null;
  public targetY: number | null = null;
  public moveSpeed: number = 2;

  private memoryManager: MemoryManager;

  constructor(
    id: number,
    name: string,
    personality: string,
    initialMemory: string = '',
    goals: string[] = [],
    initialLocationName: string = '自宅',
    job: Job | null = null,
    initialMoney: number = 500,
    initialHappiness: number = 50,
    initialHunger: number = 50,
    initialShortTermPlan: string = '特に計画なし',
    initialWeapon: Weapon | null = null
  ) {
    this.memoryManager = new MemoryManager();
    this.state = {
      id,
      name,
      personality,
      memory: initialMemory,
      currentAction: '',
      energy: 100,
      mood: 'neutral',
      happiness: initialHappiness,
      hunger: initialHunger,
      location: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
      currentLocationName: initialLocationName,
      goals,
      shortTermPlan: initialShortTermPlan,
      relationships: {},
      receivedMessages: [],
      summarizedMemory: '',
      money: initialMoney,
      job,
      weapon: initialWeapon,
      inventory: {},
    };
    if (initialMemory) {
      this.memoryManager.addMemory(initialMemory, new Date().toISOString(), 0, '初期記憶');
    }
  }

  // Getters
  get id(): number {
    return this.state.id;
  }
  get name(): string {
    return this.state.name;
  }
  get personality(): string {
    return this.state.personality;
  }
  get memory(): string {
    return this.memoryManager.getMemoryContext();
  }
  get currentAction(): string {
    return this.state.currentAction;
  }
  get energy(): number {
    return this.state.energy;
  }
  get mood(): MoodType {
    return this.state.mood;
  }
  get happiness(): number {
    return this.state.happiness;
  }
  get hunger(): number {
    return this.state.hunger;
  }
  get location(): Location {
    return this.state.location;
  }
  get x(): number {
    return this.state.location.x;
  }
  get y(): number {
    return this.state.location.y;
  }
  get currentLocationName(): string {
    return this.state.currentLocationName;
  }
  get goals(): string[] {
    return this.state.goals;
  }
  get shortTermPlan(): string {
    return this.state.shortTermPlan;
  }
  get relationships(): Record<string, number> {
    return this.state.relationships;
  }
  get receivedMessages(): Message[] {
    return this.state.receivedMessages;
  }
  get summarizedMemory(): string {
    return this.state.summarizedMemory;
  }
  get money(): number {
    return this.state.money;
  }
  get job(): Job | null {
    return this.state.job;
  }
  get weapon(): Weapon | null {
    return this.state.weapon;
  }

  // Retrieve full state
  getState(): AgentState {
    return { ...this.state };
  }

  // Change money
  changeMoney(amount: number): void {
    this.state.money += amount;
  }

  // Receive message and strengthen relationship
  receiveMessage(message: Message): void {
    this.state.receivedMessages.push(message);
    if (this.state.receivedMessages.length > 5) {
      this.state.receivedMessages.shift();
    }
    const currentStrength = this.state.relationships[message.senderId.toString()] || 0;
    this.updateRelationship(message.senderId.toString(), currentStrength + 5);
  }

  // Add to memory
  addToMemory(action: string, timestamp: string, step: number): void {
    this.memoryManager.addMemory(
      action,
      timestamp,
      step,
      `エネルギー: ${this.state.energy}%, 気分: ${this.state.mood}, 幸福度: ${this.state.happiness}%, 空腹度: ${this.state.hunger}%`
    );
    this.state.currentAction = action;
    this.state.summarizedMemory = this.memoryManager.getMemoryContext();
  }

  // Send message
  sendMessage(recipientId: number, content: string): Message | null {
    if (recipientId === this.state.id) {
      console.warn('自分自身にメッセージを送信することはできません。');
      return null;
    }
    const message: Message = {
      senderId: this.state.id,
      recipientId,
      content,
      timestamp: new Date().toISOString(),
    };
    return message;
  }

  // Generate prompt for LLM
  generatePrompt(
    availableLocations: NamedLocation[],
    zombies: { x: number; y: number; health: number }[]
  ): string {
    const memoryContext = this.memoryManager.getMemoryContext();
    const goalsText = this.state.goals.length ? `\n長期目標: ${this.state.goals.join(', ')}` : '';
    const planText = this.state.shortTermPlan
      ? `\n現在の短期計画: ${this.state.shortTermPlan}`
      : '';
    const relationshipsText = Object.keys(this.state.relationships).length
      ? `\n**人間関係:** ${Object.entries(this.state.relationships)
          .map(([id, v]) => `${id}との関係: ${v}`)
          .join(', ')}`
      : '';
    const receivedMessagesText = this.state.receivedMessages.length
      ? `\n**受信メッセージ:** ${this.state.receivedMessages
          .map((m) => `[${m.timestamp}] ${m.senderId}から: ${m.content}`)
          .join('\n')}`
      : '';
    const currentLocation = availableLocations.find(
      (l) => l.name === this.state.currentLocationName
    );
    const availResText = currentLocation?.resources?.length
      ? `\n**調達可能物資:** ${currentLocation.resources.join(', ')}`
      : '';
    const needs: string[] = [];
    if (this.state.hunger >= 70) needs.push('空腹');
    if (this.state.energy <= 30) needs.push('疲労');
    const urgentText = needs.length
      ? `\n**緊急ニーズ:** ${needs.join(', ')}。これらを優先してください。`
      : '';

    // Zombie threat and action guidance
    const nearbyZombies = zombies.filter(
      (z) => Math.hypot(this.state.location.x - z.x, this.state.location.y - z.y) < 100
    );
    let zombieText = '';
    if (nearbyZombies.length > 0) {
      zombieText =
        `\n**警告:** 近くに ${nearbyZombies.length} 体のゾンビがいます！ ` +
        `体力: ${nearbyZombies.map((z) => z.health).join(', ')}。` +
        ` 最優先で対処してください。武器を使用するか、安全な場所へ迅速に移動してください。`;
    }
    const weaponText = this.state.weapon
      ? `\n**所持武器:** ${this.state.weapon.name} (ダメージ: ${this.state.weapon.damage}, 射程: ${this.state.weapon.range})`
      : '';

    return (
      `あなたは「${this.state.name}」という住民です。` +
      `
性格: ${this.state.personality}` +
      `
現在の状態: エネルギー${this.state.energy}%, 気分:${this.state.mood}, 幸福度:${this.state.happiness}%, 空腹度:${this.state.hunger}%, 所持金:${this.state.money}G, 現在地:${this.state.currentLocationName}` +
      `
LLMからの応答では、必ず以下のJSON形式で返してください。` +
      `
{
  "plan": "短期計画 (例: 食料を探す、安全な場所へ移動する)",
  "action": "具体的な行動名のみを記述してください。例や余分なテキストは絶対に含めないでください。(例: スーパーへ移動する, 食料を調達する, 休憩する, ゾンビと戦う)",
  "mood": "${MoodTypes.join('|')}",
  "energy": "現在のエネルギー値 (0-100の整数)。エージェントの行動や状態変化を考慮し、常に0から100の範囲で適切な値を設定してください。特に、行動によってエネルギーが消費されることを考慮し、適切な残量を返してください。",
  "happiness": "現在の幸福度 (0-100の整数)",
  "hunger": "現在の空腹度 (0-100の整数)",
  "targetLocation": "移動アクションの場合のみ、利用可能な場所の名前 (例: スーパー, 自宅, 公園) を正確に記述してください。利用可能な場所は以下の通りです: ${availableLocations
    .map((l) => l.name)
    .join(', ')}。移動しない場合はこのフィールドを含めないでください。"
}` +
      goalsText +
      planText +
      relationshipsText +
      receivedMessagesText +
      availResText +
      urgentText +
      zombieText +
      weaponText +
      `
【過去の行動履歴】
${memoryContext}`
    );
  }

  // State update
  updateState(updates: Partial<AgentState>): void {
    this.state = { ...this.state, ...updates };
  }

  // Adjust energy, mood, hunger, happiness
  adjustEnergy(delta: number): void {
    this.state.energy = Math.max(0, Math.min(100, this.state.energy + delta));
  }
  updateMood(mood: MoodType): void {
    this.state.mood = mood;
  }
  adjustHappiness(delta: number): void {
    this.state.happiness = Math.max(0, Math.min(100, this.state.happiness + delta));
  }
  adjustHunger(delta: number): void {
    this.state.hunger = Math.max(0, Math.min(100, this.state.hunger + delta));
  }

  // Movement
  moveTo(location: NamedLocation): void {
    this.targetX = location.x;
    this.targetY = location.y;
    this.state.currentLocationName = location.name;
  }
  updateLocation(x: number, y: number): void {
    this.state.location = { x, y };
  }
  move(): void {
    if (this.targetX === null || this.targetY === null) return;
    const dx = this.targetX - this.state.location.x;
    const dy = this.targetY - this.state.location.y;
    const dist = Math.hypot(dx, dy);
    if (dist < this.moveSpeed) {
      this.state.location = { x: this.targetX, y: this.targetY };
      this.targetX = null;
      this.targetY = null;
    } else {
      const ang = Math.atan2(dy, dx);
      this.state.location.x += Math.cos(ang) * this.moveSpeed;
      this.state.location.y += Math.sin(ang) * this.moveSpeed;
    }
  }

  // Goals
  addGoal(goal: string): void {
    if (!this.state.goals.includes(goal)) this.state.goals.push(goal);
  }

  // Relationships
  updateRelationship(agentId: string, strength: number): void {
    this.state.relationships[agentId] = Math.max(-100, Math.min(100, strength));
  }

  // Inventory
  addItemToInventory(itemName: string, quantity: number = 1): void {
    this.state.inventory[itemName] = (this.state.inventory[itemName] || 0) + quantity;
  }
  removeItemFromInventory(itemName: string, quantity: number = 1): boolean {
    if ((this.state.inventory[itemName] || 0) >= quantity) {
      this.state.inventory[itemName] -= quantity;
      if (this.state.inventory[itemName] <= 0) delete this.state.inventory[itemName];
      return true;
    }
    return false;
  }
  hasItemInInventory(itemName: string, quantity: number = 1): boolean {
    return (this.state.inventory[itemName] || 0) >= quantity;
  }

  // Memory reset and summary
  resetMemory(): void {
    this.memoryManager = new MemoryManager();
    this.state.summarizedMemory = '';
  }
  async summarizeMemory(llmService: import('../services/llm').LLMService): Promise<void> {
    await this.memoryManager.summarizeMemories(llmService);
    this.state.summarizedMemory = this.memoryManager.getMemoryContext();
  }
}
