import { ActionHistory } from '../types';
import { LLMService } from './llm'; // LLMServiceのインポートは必要

export class MemoryManager {
  private actionHistory: ActionHistory[] = [];
  private summarizedMemories: string[] = [];

  addMemory(action: string, timestamp: string, step: number, context: string): void {
    const actionEntry: ActionHistory = {
      action,
      timestamp,
      step,
      context,
    };
    this.actionHistory.push(actionEntry);
  }

  async summarizeMemories(llmService: LLMService): Promise<void> {
    if (this.actionHistory.length === 0) {
      return;
    }

    const historyToSummarize = this.actionHistory.map(h => `[ステップ${h.step}] ${h.timestamp}: ${h.action}`).join('\n');
    const summary = await llmService.generate(historyToSummarize);
    this.summarizedMemories.push(summary);
    this.actionHistory = []; // 要約したら履歴をクリア
    console.log('Memories summarized:', summary);
  }

  getMemoryContext(): string {
    let context = this.summarizedMemories.join('\n\n[要約された記憶]\n');
    if (this.actionHistory.length > 0) {
      context += (context ? '\n\n[最近の行動]\n' : '') + this.actionHistory.map(h => `[ステップ${h.step}] ${h.timestamp}: ${h.action}`).join('\n');
    }
    return context || "まだ行動履歴がありません。";
  }

  async retrieveRelevantMemories(currentContext: string, llmService: LLMService): Promise<string> {
    const allMemories = this.summarizedMemories.concat(this.actionHistory.map(h => `[ステップ${h.step}] ${h.timestamp}: ${h.action}`));
    if (allMemories.length === 0) {
      return "関連する記憶はありません。";
    }

    const prompt = `現在の状況:\n${currentContext}\n\n以下の過去の記憶の中から、現在の状況に最も関連性の高いものを抽出してください。\n\n${allMemories.join('\n')}\n\n関連する記憶:`;

    try {
      const relevantMemory = await llmService.generate(prompt);
      return relevantMemory;
    } catch (error) {
      console.error('Failed to retrieve relevant memories:', error);
      return "関連する記憶の取得に失敗しました。";
    }
  }
}
