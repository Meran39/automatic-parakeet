import { LLMConfig, LLMServiceError } from '../types';
import { CostOptimizer } from './costOptimizer';

export class LLMService {
  private config: LLMConfig;
  private costOptimizer: CostOptimizer;
  public totalTokensUsed: number = 0;
  public totalCost: number = 0;

  constructor(config: LLMConfig, costOptimizer: CostOptimizer) {
    this.config = config;
    this.costOptimizer = costOptimizer;
  }

  async generate(prompt: string): Promise<string> {
    const requestBody = {
      model: this.config.model,
      prompt: prompt,
      stream: false,
      temperature: 0.2,
      maxTokens: 500,
    };

    console.log('LLM Request Body:', requestBody);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒でタイムアウト

    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal, // タイムアウトシグナルを追加
      });

      clearTimeout(timeoutId); // 成功したらタイムアウトをクリア

      console.log('LLM Response Status:', response.status); // 追加

      if (!response.ok) {
        const errorText = await response.text(); // エラーレスポンスの本文も取得
        console.error('LLM API Error Response:', errorText); // 追加
        throw new LLMServiceError(`LLM API request failed with status ${response.status}: ${response.statusText}. Details: ${errorText}`);
      }

      const result = await response.json();
      console.log('LLM Response JSON:', result); // 追加
      const completion = result.response;
      console.log('LLM Raw Completion:', completion); // 追加

      // トークン数とコストを更新
      const tokens = result.eval_count;
      this.totalTokensUsed += tokens;
      this.totalCost += this.costOptimizer.calculateCost(this.config.model, tokens);

      return completion;
    } catch (error) {
      clearTimeout(timeoutId); // エラー時もタイムアウトをクリア
      console.error('Error during LLM generate call:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new LLMServiceError('LLM request timed out.', error);
      } else {
        throw new LLMServiceError('Failed to parse LLM response or network error', error as Error);
      }
    }
  }
}