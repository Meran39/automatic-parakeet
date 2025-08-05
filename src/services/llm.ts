import { LLMConfig, LLMServiceError } from '../types';
import { CostOptimizer } from './costOptimizer';

/**
 * LLM (大規模言語モデル) とのやり取りを管理するサービスクラス。
 * リクエストの送信、タイムアウト処理、コスト計算、パフォーマンス計測などを担当します。
 */
export class LLMService {
  private config: LLMConfig;
  private costOptimizer: CostOptimizer;
  public totalTokensUsed: number = 0;
  public totalCost: number = 0;
  public totalResponseTime: number = 0; // 追加: 応答時間の合計 (ms)
  public requestCount: number = 0;      // 追加: リクエスト回数

  /**
   * LLMServiceのインスタンスを生成します。
   * @param config - LLMの設定オブジェクト。モデル名やAPIのベースURLなどを含みます。
   * @param costOptimizer - コスト計算を担当するCostOptimizerのインスタンス。
   */
  constructor(config: LLMConfig, costOptimizer: CostOptimizer) {
    this.config = config;
    this.costOptimizer = costOptimizer;
  }

  /**
   * 指定されたプロンプトをLLMに送信し、応答を生成します。
   * 30秒のタイムアウト処理が含まれています。
   * @param prompt - LLMに送信するプロンプト文字列。
   * @returns LLMが生成したテキストと応答時間のオブジェクト。
   * @throws {LLMServiceError} APIリクエストの失敗、タイムアウト、またはレスポンスの解析エラーが発生した場合。
   */
  async generate(prompt: string): Promise<{ completion: string; responseTime: number }> {
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
    
    const startTime = Date.now(); // ★追加: 開始時間を記録

    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal, // タイムアウトシグナルを追加
      });

      const responseTime = Date.now() - startTime; // ★追加: 応答時間を計算
      this.totalResponseTime += responseTime;      // ★追加: 合計応答時間に加算
      this.requestCount++;                         // ★追加: リクエスト回数をインクリメント

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

      return { completion, responseTime }; // ★変更: オブジェクトを返す
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

  /**
   * 平均応答時間を計算します。
   * @returns 平均応答時間 (ms)。リクエストがない場合は0を返す。
   */
  getAverageResponseTime(): number {
    if (this.requestCount === 0) {
      return 0;
    }
    return this.totalResponseTime / this.requestCount;
  }
}
