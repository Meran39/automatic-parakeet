import { MemoryManager } from '../services/memoryManager';
import { NamedLocation, Job, Weapon, Message, IAgent, AgentMood, Proposal, ItemType, IZombie, SimulationLog } from '../types';

export class Agent implements IAgent {
  id: number;
  name: string;
  personality: string;
  memoryManager: MemoryManager;
  goals: string[];
  currentLocationName: string;
  job: Job | null;
  money: number;
  happiness: number;
  hunger: number;
  shortTermPlan: string;
  weapon: Weapon | null;
  x: number;
  y: number;
  targetX: number | null;
  targetY: number | null;
  speed: number;
  energy: number;
  fear: number; // 恐怖心を追加
  mood: AgentMood; // IAgent から追加
  relationships: { [agentId: string]: number };
  receivedMessages: Message[];
  pendingProposals: Proposal[]; // 新しく追加
  inventory: { [item in ItemType]?: number }; // 新しく追加
  targetLocationName: string | null; // 追加
  private addLog: (type: SimulationLog['type'], message: string, agentId?: number) => void; // 追加

  constructor(
    id: number,
    name: string,
    personality: string,
    goals: string[],
    initialLocationName: string,
    job: Job | null,
    initialMoney: number,
    initialHappiness: number,
    initialHunger: number,
    initialShortTermPlan: string,
    initialWeapon: Weapon | null,
    addLog: (type: SimulationLog['type'], message: string, agentId?: number) => void // 追加
  ) {
    this.id = id;
    this.name = name;
    this.personality = personality;
    this.memoryManager = new MemoryManager();
    this.goals = goals;
    this.currentLocationName = initialLocationName;
    this.job = job;
    this.money = initialMoney;
    this.happiness = initialHappiness;
    this.hunger = initialHunger;
    this.shortTermPlan = initialShortTermPlan;
    this.weapon = initialWeapon;
    this.x = 0;
    this.y = 0;
    this.targetX = null;
    this.targetY = null;
    this.speed = 10;
    this.energy = 100;
    this.fear = 0; // 恐怖心を初期化
    this.mood = 'neutral'; // 初期値
    this.relationships = {};
    this.receivedMessages = [];
    this.pendingProposals = []; // 初期化
    this.inventory = {}; // 初期値
    this.targetLocationName = null; // 初期値
    this.addLog = addLog; // addLogを保存
  }

  updateState(newState: Partial<IAgent>) {
    Object.assign(this, newState);
  }

  moveTo(location: NamedLocation) {
    this.targetX = location.x;
    this.targetY = location.y;
    this.targetLocationName = location.name; // 追加
  }

  arriveAtLocation(locationName: string) {
    this.currentLocationName = locationName;
  }

  move() {
    if (this.targetX !== null && this.targetY !== null) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.speed) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.targetX = null;
        this.targetY = null;
        this.currentLocationName = this.targetLocationName || this.currentLocationName; // 追加
        this.targetLocationName = null; // 追加
        this.addLog('info', `${this.name}が${this.currentLocationName}に到着しました。`, this.id); // addLogを呼び出す
      } else {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
    }
  }

  changeMoney(amount: number) {
    this.money += amount;
  }

  adjustEnergy(amount: number) {
    this.energy = Math.max(0, Math.min(100, this.energy + amount));
  }

  adjustFear(amount: number) {
    this.fear = Math.max(0, Math.min(100, this.fear + amount));
  }

  adjustHappiness(amount: number) {
    this.happiness = Math.max(0, Math.min(100, this.happiness + amount));
  }

  adjustHunger(amount: number) {
    this.hunger = Math.max(0, Math.min(100, this.hunger + amount));
  }

  attack(target: IZombie): number {
    if (!this.weapon) {
      return 0; // 武器がない場合は攻撃できない
    }

    // 距離を計算
    const distance = Math.sqrt(Math.pow(this.x - target.x, 2) + Math.pow(this.y - target.y, 2));

    if (this.weapon.type === 'ranged' && distance <= this.weapon.range) {
      // 遠距離武器の場合、射程圏内なら攻撃可能
      return this.weapon.damage;
    } else if (this.weapon.type === 'melee' && distance <= this.weapon.range) {
      // 近接武器の場合、射程圏内なら攻撃可能
      return this.weapon.damage;
    }
    return 0; // 射程圏外
  }

  updateMood(mood: AgentMood) {
    this.mood = mood;
  }

  updateRelationship(agentId: string, change: number) {
    if (!this.relationships[agentId]) {
      this.relationships[agentId] = 0;
    }
    this.relationships[agentId] += change;
  }

  receiveMessage(message: Message) {
    this.receivedMessages.push(message);
  }

  addItemToInventory(item: ItemType, quantity: number) {
    if (!this.inventory[item]) {
      this.inventory[item] = 0;
    }
    this.inventory[item] += quantity;
  }

  hasItemInInventory(item: ItemType): boolean {
    return !!this.inventory[item] && this.inventory[item]! > 0;
  }

  removeItemFromInventory(item: ItemType) {
    if (this.inventory[item] && this.inventory[item] > 0) {
      this.inventory[item]--;
    }
  }

  consumeItem(item: ItemType) {
    if (this.hasItemInInventory(item)) {
      this.removeItemFromInventory(item);
      switch (item) {
        case 'パン':
          this.adjustHunger(50); // 空腹度を回復
          this.adjustEnergy(20); // エネルギーも少し回復
          break;
        case '水':
          this.adjustEnergy(10); // エネルギーを回復
          break;
        // 他のアイテムがあればここに追加
      }
    }
  }
}