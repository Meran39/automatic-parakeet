import llmCosts from '../config/llm-costs.json';

export class CostOptimizer {
  private costs: {
    [provider: string]: {
      [model: string]: {
        input_cost_per_1k_tokens: number;
        output_cost_per_1k_tokens: number;
      };
    };
  } = llmCosts;

  calculateCost(model: string, tokens: number): number {
    for (const provider in this.costs) {
      if (this.costs[provider][model]) {
        // For simplicity, we'll use the output cost for now.
        return (tokens / 1000) * this.costs[provider][model].output_cost_per_1k_tokens;
      }
    }
    return 0; // モデルが見つからない場合は0を返す
  }
}