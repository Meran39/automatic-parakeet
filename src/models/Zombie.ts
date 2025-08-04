import { Agent } from './Agent';

export class Zombie {
  id: number;
  x: number;
  y: number;
  health: number;
  targetAgentId: number | null;
  speed: number;

  constructor(id: number, x: number, y: number, health: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.health = health;
    this.targetAgentId = null;
    this.speed = 5; // ゾンビの移動速度
  }

  moveTowardsAgent(targetAgent: Agent) {
    const dx = targetAgent.x - this.x;
    const dy = targetAgent.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }

  takeDamage(amount: number) {
    this.health -= amount;
  }

  attackAgent(targetAgent: Agent): number {
    const distance = Math.sqrt(Math.pow(this.x - targetAgent.x, 2) + Math.pow(this.y - targetAgent.y, 2));
    const attackRange = 15; // ゾンビの攻撃範囲
    const damage = 10; // ゾンビの攻撃力

    if (distance <= attackRange) {
      return damage;
    }
    return 0;
  }
}