import { LLMConfig, LLMProvider, Purchase } from '../types';
import { Agent } from '../models/Agent';
import costConfig from '../config/llm-costs.json';

// 型定義
type CostConfig = {
  [provider in LLMProvider]?: {
    [model: string]: {
      input_cost_per_1k_tokens: number;
      output_cost_per_1k_tokens: number;
    };
  };
};

const costs: CostConfig = costConfig;

export class CostOptimizer {
  private optimizationMode: 'cost' | 'quality' = 'quality';

  setOptimizationMode(mode: 'cost' | 'quality'): void {
    this.optimizationMode = mode;
  }

  selectOptimalModel(configs: Record<string, LLMConfig>, currentProvider: string): LLMConfig {
    if (this.optimizationMode === 'cost') {
      if (currentProvider === 'huggingface') {
        return { ...configs.huggingface, model: 'distilbert-base-uncased' };
      } else if (currentProvider === 'openai') {
        return { ...configs.openai, model: 'gpt-3.5-turbo' };
      } else if (currentProvider === 'anthropic') {
        return { ...configs.anthropic, model: 'claude-3-haiku-20240307' };
      }
    }
    return configs[currentProvider as keyof typeof configs] || configs.huggingface;
  }

  estimateCost(inputTokens: number, outputTokens: number, modelName: string, provider: LLMProvider): number {
    const providerCosts = costs[provider];
    if (!providerCosts) return 0;

    const modelCost = providerCosts[modelName];
    if (!modelCost) return 0;

    const inputCost = (inputTokens / 1000) * modelCost.input_cost_per_1k_tokens;
    const outputCost = (outputTokens / 1000) * modelCost.output_cost_per_1k_tokens;
    
    return inputCost + outputCost;
  }

  // 新しい経済関連メソッド

  /**
   * エージェントに給与を支払う
   * @param agent 給与を支払うエージェント
   * @returns 支払われた給与額
   */
  paySalary(agent: Agent): number {
    if (agent.job && agent.job.salary) {
      agent.changeMoney(agent.job.salary);
      return agent.job.salary;
    }
    return 0;
  }

  /**
   * エージェントの購入を処理する
   * @param agent 購入を行うエージェント
   * @param purchase 購入情報 (itemName, cost)
   * @returns 購入が成功したかどうか
   */
  handlePurchase(agent: Agent, purchase: Purchase): boolean {
    if (agent.money >= purchase.cost) {
      agent.changeMoney(-purchase.cost);
      return true;
    }
    return false;
  }
}
