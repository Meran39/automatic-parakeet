import { describe, it, expect, beforeEach } from 'vitest';
import { CostOptimizer } from './costOptimizer';
import llmCosts from '../config/llm-costs.json';

describe('CostOptimizer', () => {
  let costOptimizer: CostOptimizer;

  beforeEach(() => {
    costOptimizer = new CostOptimizer();
  });

  it('should be instantiated', () => {
    expect(costOptimizer).toBeInstanceOf(CostOptimizer);
  });

  it('should calculate cost correctly for a known model', () => {
    const model = 'llama3';
    const tokens = 2000;
    const expectedCost = (tokens / 1000) * llmCosts.ollama[model].output_cost_per_1k_tokens;
    
    const cost = costOptimizer.calculateCost(model, tokens);
    
    expect(cost).toBe(expectedCost);
  });

  it('should return 0 for an unknown model', () => {
    const model = 'unknown-model';
    const tokens = 1000;
    
    const cost = costOptimizer.calculateCost(model, tokens);
    
    expect(cost).toBe(0);
  });

  it('should return 0 when tokens are 0', () => {
    const model = 'llama3';
    const tokens = 0;
    
    const cost = costOptimizer.calculateCost(model, tokens);
    
    expect(cost).toBe(0);
  });
});
